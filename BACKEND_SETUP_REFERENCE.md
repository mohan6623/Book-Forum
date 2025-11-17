# Backend Deployment & SSL Setup - Complete Reference

## Problem Overview
**Issue:** Spring Boot backend deployed on Oracle Cloud was not accessible externally via HTTPS. Frontend (Vercel) couldn't communicate with the backend due to:
1. Self-signed SSL certificate causing browser/fetch errors (`ERR_CERT_AUTHORITY_INVALID`)
2. Port 8443 working but non-standard, needed port 443 for production
3. Multiple firewall layers blocking external access (iptables, Oracle Security Lists)
4. Permission issues binding Java to privileged ports (<1024)

**Solution:** Implement Let's Encrypt SSL certificate, configure Spring Boot for HTTPS on port 443, and properly configure all firewall layers.

---

## 1. Initial Diagnostics & Port 8443 Troubleshooting

### Problem: Backend not reachable externally on port 8443
**Debug:** Service running locally but `Test-NetConnection` from Windows failing

```bash
# Check if service is listening on port 8443
sudo ss -ltnp | grep 8443
# Shows if app bound to 0.0.0.0:8443 (all interfaces) or 127.0.0.1:8443 (localhost only)

# View firewall rules (iptables - Oracle's default firewall)
sudo iptables -L INPUT -n -v | head -20
# Look for REJECT rules blocking traffic

# Check systemd service status
sudo systemctl status bookforum

# View service logs
sudo journalctl -u bookforum -n 50 --no-pager
# Check for "Tomcat started on port..." messages
```

---

## 2. Fix iptables Blocking (Port 8443)

### Problem: Oracle Cloud's iptables had a REJECT rule blocking all ports except SSH (22)
**Debug:** `sudo iptables -L INPUT` showed REJECT rule before any 8443 ACCEPT rules

```bash
# Add rule for port 8443 BEFORE the REJECT rule (position 5)
sudo iptables -I INPUT 5 -p tcp --dport 8443 -j ACCEPT

# If rule was added in wrong position, remove it
sudo iptables -D INPUT 7  # Remove rule at position 7

# View updated rules to verify correct order
sudo iptables -L INPUT -n -v | head -10

# Save iptables rules permanently (survives reboot)
sudo netfilter-persistent save

# OR if netfilter-persistent not installed:
sudo apt install iptables-persistent -y
sudo netfilter-persistent save
```

**Why this matters:** Rules are processed top-to-bottom. If REJECT comes before ACCEPT, traffic gets blocked.

---

## 3. Get Let's Encrypt SSL Certificate

### Problem: Self-signed certificate caused `ERR_CERT_AUTHORITY_INVALID` errors in frontend
**Solution:** Get a free, trusted SSL certificate from Let's Encrypt

```bash
# Stop service to free port 80 (required for certbot HTTP-01 challenge)
sudo systemctl stop bookforum

# Install certbot via snap
sudo snap install --classic certbot

# Get SSL certificate (interactive - will prompt for email and agreement)
sudo certbot certonly --standalone -d api.bookforum.app
# Certificate saved to: /etc/letsencrypt/live/api.bookforum.app/

# Convert Let's Encrypt PEM certificate to PKCS12 format (Spring Boot requirement)
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/api.bookforum.app/fullchain.pem \
  -inkey /etc/letsencrypt/live/api.bookforum.app/privkey.pem \
  -out /home/ubuntu/keystore-letsencrypt.p12 \
  -name tomcat \
  -passout pass:changeit

# Set ownership so ubuntu user can access
sudo chown ubuntu:ubuntu /home/ubuntu/keystore-letsencrypt.p12
```

**Certificate Details:**
- Location: `/etc/letsencrypt/live/api.bookforum.app/`
- Keystore: `/home/ubuntu/keystore-letsencrypt.p12`
- Password: `changeit`
- Alias: `tomcat`

---

## 4. Update systemd Service for Port 443 & SSL

### Problem: JAR file path wrong, needed to switch from port 8443 to 443, update keystore
**Debug:** `journalctl` showed "Unable to access jarfile /home/ubuntu/Books.jar.original"

```bash
# Find the actual JAR file
ls -lh /home/ubuntu/*.jar
# Result: /home/ubuntu/Book-Forum-API.jar

# Edit systemd service
sudo systemctl edit --full bookforum
```

**Updated `/etc/systemd/system/bookforum.service` - ExecStart line:**
```ini
ExecStart=/usr/bin/java -jar /home/ubuntu/Book-Forum-API.jar --server.address=0.0.0.0 --server.port=443 --server.ssl.enabled=true --server.ssl.key-store=/home/ubuntu/keystore-letsencrypt.p12 --server.ssl.key-store-password=changeit --server.ssl.key-store-type=PKCS12 --server.ssl.key-alias=tomcat
```

**Key changes:**
- JAR path: `/home/ubuntu/Book-Forum-API.jar` (was Books.jar.original)
- Port: `443` (was 8443)
- Keystore: `/home/ubuntu/keystore-letsencrypt.p12` (was self-signed keystore)
- Bind address: `0.0.0.0` (all interfaces, not just localhost)

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Restart service
sudo systemctl restart bookforum

# Check status
sudo systemctl status bookforum

# View logs to check for errors
sudo journalctl -u bookforum -n 30 --no-pager
```

---

## 5. Fix Permission Denied for Port 443

### Problem: `java.net.BindException: Permission denied` when binding to port 443
**Cause:** Ports below 1024 are privileged; non-root processes need special capabilities

```bash
# Find real Java binary (not symlink)
readlink -f /usr/bin/java
# Output example: /usr/lib/jvm/java-21-openjdk-amd64/bin/java

# Give Java capability to bind to privileged ports (<1024)
# Replace path with your actual Java binary path from readlink output
sudo setcap cap_net_bind_service=+ep /usr/lib/jvm/java-21-openjdk-amd64/bin/java

# Restart service
sudo systemctl restart bookforum

# Watch logs in real-time to see startup
sudo journalctl -u bookforum -f
# Press Ctrl+C to exit

# Look for: "Tomcat started on port 443 (https) with context path '/'"
```

**Why setcap is needed:** Without CAP_NET_BIND_SERVICE capability, only root can bind to ports 1-1023.

---

## 6. Open Port 443 in Firewall

### Problem: Even with service running, external access still blocked by iptables
**Solution:** Add iptables rule for port 443 (same as we did for 8443)

```bash
# Add iptables rule for port 443 at position 5 (before REJECT)
sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT

# Save permanently
sudo netfilter-persistent save

# Verify rule was added correctly
sudo iptables -L INPUT -n -v | grep 443
# Should show ACCEPT rules for port 443 BEFORE any REJECT rules
```

---

## 7. Oracle Cloud Security List (Manual Console Steps)

### Problem: Oracle Cloud has TWO firewall layers - iptables AND Security Lists
**Both must allow the port for external access**

**Steps in Oracle Cloud Console:**
1. Navigate to: **Networking → Virtual Cloud Networks**
2. Click your VCN → **Subnets** → Click backend subnet
3. Under **Security Lists**, click on the Security List name
4. Click **Add Ingress Rules**
5. Fill in:
   - **Source Type:** CIDR
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination Port Range:** `443`
   - **Description:** `HTTPS API access`
6. Click **Add Ingress Rules**

**Screenshot reference:** (You should already have this from the attachments showing port 443 rule)

---

## 8. Verification Commands

### Verify service is running and accessible

```bash
# Check if service is listening on port 443
sudo ss -tlnp | grep 443
# Expected: LISTEN ... *:443 ... users:(("java",pid=XXXXX,fd=XX))

# Test locally on the VM
curl -k https://127.0.0.1/api/books
# Should return JSON book data or authentication error (not connection refused)

# Check if Tomcat started successfully
sudo journalctl -u bookforum -n 100 --no-pager | grep -i "tomcat started"
# Expected: "Tomcat started on port 443 (https) with context path '/'"

# Test a public endpoint that doesn't require auth
curl -k https://127.0.0.1/api/books
```

---

## 9. Windows/External Testing (PowerShell)

### Verify external access from your local machine

```powershell
# Test TCP port connectivity
Test-NetConnection -ComputerName api.bookforum.app -Port 443
# Expected: TcpTestSucceeded : True

# Test actual API endpoint
curl.exe https://api.bookforum.app/api/books
# Should return JSON data (no SSL errors with Let's Encrypt cert)

# If you get SSL errors, your cert might not be set up correctly
# If you get connection timeout, firewall issue (iptables or Security List)
# If you get connection refused, service not running or not bound to 0.0.0.0
```

---

## 10. Frontend Update (Vercel)

### Problem: Frontend still calling old port 8443 or self-signed cert API
**Solution:** Update environment variable to use standard HTTPS port 443

**Local code update (already done):**
```typescript
// File: src/config/api.ts
export const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_BASE_URL ?? 'https://api.bookforum.app';
```

**Vercel Environment Variable:**
1. Go to **Vercel Dashboard** → Your Project
2. Settings → **Environment Variables**
3. Update or add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://api.bookforum.app` (no port number - 443 is default)
   - **Environments:** Check all (Production, Preview, Development)
4. Click **Save**

**Deploy changes:**
```powershell
cd "C:\Users\Mohan\Music\Book Shelf\story-scape-ui"
git add .
git commit -m "Update API to use HTTPS on port 443"
git push origin main
```

Vercel will auto-deploy. After deployment, frontend at `https://www.bookforum.app` will call `https://api.bookforum.app` with trusted SSL.

---

## Key Files Modified

### Backend VM
1. **`/etc/systemd/system/bookforum.service`**
   - Service configuration with SSL settings and environment variables
   - ExecStart points to correct JAR with SSL flags

2. **`/home/ubuntu/keystore-letsencrypt.p12`**
   - Let's Encrypt SSL certificate in PKCS12 format
   - Password: `changeit`, Alias: `tomcat`

3. **`/etc/letsencrypt/live/api.bookforum.app/`**
   - Original Let's Encrypt PEM certificates
   - Auto-renewed by certbot (runs via cron)

### Frontend
1. **`story-scape-ui/src/config/api.ts`**
   - API base URL configuration
   - Falls back to `https://api.bookforum.app` if no env var

---

## SSL Certificate Renewal

### Let's Encrypt certificates expire after 90 days

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate (dry run to test)
sudo certbot renew --dry-run

# Actual renewal (certbot auto-renews via cron, but you can run manually)
sudo systemctl stop bookforum
sudo certbot renew
sudo systemctl start bookforum
```

**Auto-renewal:** Certbot installs a systemd timer that auto-renews. Check with:
```bash
sudo systemctl list-timers | grep certbot
```

After renewal, you need to regenerate the PKCS12 keystore:
```bash
sudo openssl pkcs12 -export \
  -in /etc/letsencrypt/live/api.bookforum.app/fullchain.pem \
  -inkey /etc/letsencrypt/live/api.bookforum.app/privkey.pem \
  -out /home/ubuntu/keystore-letsencrypt.p12 \
  -name tomcat \
  -passout pass:changeit
sudo chown ubuntu:ubuntu /home/ubuntu/keystore-letsencrypt.p12
sudo systemctl restart bookforum
```

---

## Troubleshooting Quick Reference

### Service won't start
```bash
sudo journalctl -u bookforum -n 100 --no-pager
# Look for: "Unable to access jarfile" → wrong JAR path
# Look for: "Permission denied" → need setcap on Java binary
# Look for: "Address already in use" → another process on port 443
```

### External access blocked
```bash
# 1. Check service is running and bound to 0.0.0.0
sudo ss -tlnp | grep 443

# 2. Check iptables allows port 443
sudo iptables -L INPUT -n -v | grep 443

# 3. Verify Oracle Security List has ingress rule for 443
# (Check in Oracle Cloud Console)

# 4. Test locally first
curl -k https://127.0.0.1/api/books
```

### SSL certificate issues
```bash
# Verify certificate files exist
ls -l /etc/letsencrypt/live/api.bookforum.app/

# Verify keystore exists and is readable
ls -l /home/ubuntu/keystore-letsencrypt.p12

# Test SSL connection
openssl s_client -connect api.bookforum.app:443 -servername api.bookforum.app
# Should show certificate chain with Let's Encrypt CA
```

---

## Summary of Layers Fixed

1. ✅ **Application Layer:** Spring Boot configured with SSL on port 443
2. ✅ **OS Permissions:** Java binary given `cap_net_bind_service` capability
3. ✅ **iptables Firewall:** Port 443 allowed with rule positioned before REJECT
4. ✅ **Oracle Security List:** Ingress rule added for TCP port 443 from 0.0.0.0/0
5. ✅ **DNS:** A record `api.bookforum.app` pointing to backend VM IP
6. ✅ **SSL Certificate:** Let's Encrypt trusted certificate installed
7. ✅ **Frontend:** Updated to call `https://api.bookforum.app` (port 443 default)

---

**Deployment completed successfully!** 🎉

Your API is now accessible at: `https://api.bookforum.app`  
Your frontend is live at: `https://www.bookforum.app`
