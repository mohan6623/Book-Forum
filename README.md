# 🎨 BookForum

> The modern, responsive frontend for the Book Forum platform.  
> Built with React, TypeScript, and Shadcn UI.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Shadcn UI](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)

---

## 🎯 Project Overview

**BookForum** is a full-stack digital library and community platform where users can discover, rate, and discuss books. It is built as a modern distributed system consisting of two key components:

1.  **Backend API (Spring Boot)**: A robust, secure REST API handling data persistence, authentication (JWT/OAuth2), and complex business logic.
2.  **Frontend UI (React + Vite)**: This repository contains the responsive user interface that consumes the backend API to deliver a seamless user experience.

### The Big Picture
The goal of **BookForum** is to create a feature-rich social platform for readers. While the backend handles the heavy lifting of security and data management, this frontend provides the interactive layer—allowing users to search catalogs, manage profiles, and engage in discussions in real-time.

Together, they form a complete ecosystem for:
*   **Discovery**: Browsing and searching vast book collections.
*   **Community**: Connecting users through ratings, reviews, and social logins.
*   **Management**: empowering admins with dashboard tools to curate content.

---

## ✨ Features

### 👤 User Experience
- **Authentication** — Email/Password login, Register, Google/GitHub OAuth
- **Book Discovery** — Search, filter by category/author, pagination
- **Interactions** — Rate books (1-5 stars), post comments, manage profile
- **Security** — Automatic token refresh, protected routes

### 🛠️ Admin Dashboard
- **Book Management** — Add, edit, delete books
- **Image Uploads** — Drag-and-drop cover image uploads (Cloudinary)
- **Monitoring** — Access to system health status

### 🎨 UI/UX
- **Dark Mode** — System aware theme preference
- **Toast Notifications** — Real-time feedback for actions (Sonner)
- **Form Validation** — Robust client-side validation (Zod + React Hook Form)

---

## 🛠️ Tech Stack

- **Core:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Shadcn UI, Class Variance Authority
- **State/Data:** TanStack Query (React Query), Context API
- **Forms:** React Hook Form, Zod
- **Routing:** React Router DOM
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/story-scape-ui.git
cd story-scape-ui

# Install dependencies
npm install
```

### Configuration

Create a `.env.local` file in the root directory:

```bash
# Backend API URL (defaulting to localhost:8080)
VITE_API_BASE_URL=http://localhost:8080
```

### Run Locally

```bash
npm run dev
```
The app will open at `http://localhost:5173`

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 📂 Project Structure

```
src/
├── components/        # Reusable UI components (Shadcn + Custom)
├── pages/            # Main application pages (Login, BookDetails, etc.)
├── hooks/            # Custom React hooks (useAuth, useToast)
├── services/         # API service layers (Axios config)
├── lib/              # Utilities (cn, validators)
├── contexts/         # React Contexts (AuthContext)
└── types/            # TypeScript interfaces
```

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE for details.
