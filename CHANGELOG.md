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

## [Latest] - Enhanced Filter System & User Profile Menu

### Added
- Redesigned filter panel with minimal, modern design inspired by reference UI
- Active filter badges/pills with individual remove buttons
- "Clear all" button for quick filter reset
- Three-column filter layout: Categories, Rating, Authors
- Search inputs for filtering categories and authors lists
- Radio button rating filter (5+, 4+, 3+, 2+, 1+ stars) with star icons
- User profile dropdown menu in header with avatar icon
- Profile menu options: Login/Logout, Settings, Theme toggle, Help
- Color-coded filter sections (blue for categories, yellow for rating, purple for authors)

### Changed
- Updated filter structure to include authors array and simplified rating to single minimum value
- Replaced standalone theme toggle button with user profile menu
- Theme toggle moved inside profile dropdown menu
- Filter panel now 900px wide with better spacing for three-column layout
- Filter panel now shows active filters as removable badges at the top

### Technical Details
- Updated `src/types/book.ts` - Changed FilterOptions: added authors[], changed rating from min/max to single value
- Completely rewrote `src/components/FilterPanel.tsx` with new minimal three-column design
- Created `src/components/UserProfileMenu.tsx` with dropdown menu using shadcn components
- Updated `src/components/Header.tsx` to use UserProfileMenu, removed theme button
- Updated `src/pages/Index.tsx` filter logic to handle authors and simplified rating filter
