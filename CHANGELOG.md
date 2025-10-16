# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created Header component with Book Forum branding and theme toggle (light/dark mode)
- Integrated next-themes for theme management
- Added Spring Boot REST API integration at http://localhost:8080
- Created API configuration file (src/config/api.ts) with backend endpoints
- Created bookService for API calls to Java backend
- Added React Query for data fetching and caching
- Added PageResponse interface for backend pagination support
- Implemented loading and error states for book data fetching
- Added search functionality connected to backend /books/search endpoint
- Created CHANGELOG.md to track all project changes
- Implemented scroll-based search bar repositioning with smooth transitions

### Changed
- Reduced BookCard tile sizes for denser layout
- Moved rating display to bottom-left corner of book image as a badge with single star icon
- Updated book grid to show 2-6 columns based on screen size (responsive)
- Modified Book interface to use numeric id instead of string
- Updated color palette in index.css with new semantic tokens
- Added new CSS variables for gradients, shadows, and transitions
- Extended tailwind.config.ts with new animations (fade-in, scale-in, float, glow)
- Removed "Filters" text from filter button, showing only icon
- Search bar and filter button now move to header on scroll with smooth transitions
- Reduced search bar and filter button sizes for better header integration

### Removed
- Removed Supabase integration (client.ts, config.toml, .env)
- Deleted mock book data (src/data/mockBooks.ts)
- Removed inline rating display from BookCard content area

### Technical Details
- Backend: Java Spring Boot REST API
- Database: PostgreSQL
- Authentication: JWT and OAuth (not yet implemented in frontend)
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS with custom design system
- State Management: React Query (@tanstack/react-query)
