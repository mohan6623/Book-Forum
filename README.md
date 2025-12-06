# Welcome to bookforum project

## Deployed URLs
- **Frontend**: https://main.d3uwoq5i447ir.amplifyapp.com/
- **Backend**: http://book-forum.ap-south-1.elasticbeanstalk.com/

## Project info

**URL**: https://lovable.dev/projects/c6bcd9c7-733f-4904-9812-8fbb7c0ecf11

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c6bcd9c7-733f-4904-9812-8fbb7c0ecf11) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c6bcd9c7-733f-4904-9812-8fbb7c0ecf11) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Backend integration

This UI is wired to the Spring Boot backend in `springSecurity` running on http://localhost:8080 by default.

- Configure the base URL via Vite env:

	Create a `.env.local` in the project root if you need to override:

	```sh
	VITE_API_BASE_URL=http://localhost:8080
	```

- Endpoints used (from backend):
	- GET `/books?page=&size=` returns a Spring `Page<BookDto>`
	- GET `/bookid/{id}` returns `BookDto`
	- GET `/books/search?title=&author=&category=&page=&size=` returns a page
	- POST `/book/{id}/rating` (auth)
	- GET `/book/{id}/ratings`
	- GET `/book/{id}/comment?page=&size=` (204 when empty)
	- POST `/book/{id}/comment` (auth)
	- PUT `/book/{id}/comment` (auth)
	- DELETE `/comment/{commentId}` (auth)
	- Admin only:
		- POST `/addbook` (multipart)
		- PUT `/book/{id}` (multipart)
		- DELETE `/book/{id}`

- Auth endpoints:
	- POST `/register` -> 201
	- POST `/login` -> `{ token, user }`

The frontend stores the JWT in localStorage and sends it in the `Authorization: Bearer <token>` header for protected calls.

## Run locally (dev)

Start the frontend dev server (it will run on http://localhost:5173):

```powershell
npm install
npm run dev
```

If you need to override the API URL, create `.env.local` in the project root with:

```text
VITE_API_BASE_URL=http://localhost:8080
```


