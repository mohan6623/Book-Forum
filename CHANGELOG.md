# Changelog

All notable changes to this project will be documented in this file.

## [Latest] - 2025-10-21

### Added
- **Admin Panel Redesign**: Complete redesign with modern dashboard layout
  - Added stats cards showing Total Books, Categories, and Authors with icons
  - Implemented search and filter functionality for books
  - Book list now displays in horizontal layout with inline action buttons
  - Added dialogs for adding and editing books (cleaner UX)
  - View, Edit, and Delete buttons directly on each book item
  - Search bar filters by title and author in real-time
  - Category dropdown filter
  - "Add New Book" button prominently displayed in header
- **User Profile Page**: New page for users to manage their profile at `/profile`
  - View and update email address
  - Change password functionality with confirmation
  - Upload/update profile picture with live preview
  - Accessible from user menu dropdown via "Profile" link
  - Protected route requiring authentication
- **Fixed Rating and Comment Endpoints**: Corrected API endpoint paths to match backend
  - Rating endpoint: `/rating/{id}` (was `/book/{id}/rating`)
  - Comment endpoint: `/comment/{id}` (was `/book/{id}/comment`)
  - Update comment endpoint: `/comment/{id}` (was `/book/{id}/comment`)
  - These corrections fix the "not sending request to backend" issue
- **User Service**: New service for user profile management (`src/services/userService.ts`)
  - Update user details including email and password
  - Profile picture upload support with multipart form data
  - Proper authentication headers included

### Changed
- **API Configuration**: Updated endpoint paths in `src/config/api.ts` to match backend controller
  - `ADD_RATING`: `/rating/{id}`
  - `ADD_COMMENT`: `/comment/{id}`
  - `UPDATE_COMMENT`: `/comment/{id}`
  - Added `UPDATE_USER`: `/user/{userId}`
- **Admin Panel**: Removed tab-based interface in favor of unified list view
  - More efficient workflow for managing books
  - Inline actions reduce clicks needed
  - Better use of screen space
- **User Menu**: Added "Profile" option that navigates to profile page
- **Auth Types**: Extended user type to include `email` and `imageData` fields

### Technical Changes
- Created `src/services/userService.ts` for user-related API calls
- Created `src/pages/UserProfile.tsx` for user profile management
- Completely rewrote `src/pages/AdminPanel.tsx` with new dashboard layout
- Updated routing in `src/App.tsx` to include `/profile` protected route
- Enhanced `UserProfileMenu.tsx` with profile navigation
- Updated `JwtResponse` type to include email and imageData fields

### Backend Endpoints Used
- `PUT /user/{user_id}` - Update user profile with multipart form (requires authentication)
- `POST /rating/{id}` - Add book rating (requires authentication)
- `POST /comment/{id}` - Add book comment (requires authentication)
- `PUT /comment/{id}` - Update book comment (requires authentication)
- `DELETE /comment/{commentId}` - Delete book comment (requires authentication)
- `GET /books` - Fetch books with pagination
- `POST /addbook` - Add new book (requires ROLE_ADMIN)
- `PUT /book/{id}` - Update book (requires ROLE_ADMIN)
- `DELETE /book/{id}` - Delete book (requires ROLE_ADMIN)

## [2025-01-XX] - Authentication & Authorization System

### Added
- **Authentication System**
  - Created `AuthContext` for managing authentication state across the application
  - Implemented JWT token decoding and validation
  - Added token expiration checking and automatic logout
  - Created login page (`/login`) with username and password authentication
  - Created register page (`/register`) with username, email, password, and confirm password fields
  - Added password validation (minimum 6 characters)
  - Added password confirmation matching validation
  - Added authentication state persistence across page refreshes

- **Role-Based Access Control**
  - Implemented admin role detection from JWT tokens (`ROLE_ADMIN`)
  - Created `ProtectedRoute` component for route protection
  - Added role-based UI elements in navigation
  - Admin panel automatically redirects non-admin users

- **Admin Panel** (`/admin`)
  - Created comprehensive admin panel accessible only to users with `ROLE_ADMIN`
  - **Add Book Tab**: Form to add new books with title, author, category, description, and image upload
  - **Update Book Tab**: Form to update existing books by ID with optional image replacement
  - **Delete Book Tab**: Form to delete books by ID
  - Category dropdown with predefined options (Fiction, Non-Fiction, Science, History, Biography, Fantasy, Mystery, Romance)
  - Real-time loading states and success/error notifications
  - Integrated with existing bookService for backend communication

- **UI Enhancements**
  - Updated `UserProfileMenu` to show actual authentication state
  - Added username display in profile menu for authenticated users
  - Added "Admin Panel" menu item for admin users (Shield icon)
  - Implemented proper login/logout functionality in navigation
  - Added functional login/logout actions with navigation

- **Book Details Page Security**
  - Added authentication gates for rating and commenting features
  - Blur overlay with "Sign in to rate/comment" message for unauthenticated users
  - Disabled rating stars and comment input for non-authenticated users
  - Users can still view existing ratings and comments without authentication
  - Updated BookDetails to use AuthContext instead of direct authService calls

### Dependencies
- Added `jwt-decode@latest` package for JWT token parsing and validation

### Backend Endpoints Used
- `POST /register` - User registration (username, password, role)
- `POST /login` - User authentication (returns JWT token)
- `POST /addbook` - Add new book (Admin only, requires `ROLE_ADMIN`)
- `PUT /book/{id}` - Update book (Admin only, requires `ROLE_ADMIN`)
- `DELETE /book/{id}` - Delete book (Admin only, requires `ROLE_ADMIN`)

### Technical Implementation
- Authentication uses JWT tokens stored in localStorage
- Admin role is validated on both frontend (UI) and backend (API endpoints)
- All book management operations require admin authentication
- Protected routes show loading state while checking authentication
- Context provider wraps entire app for global auth state access

### Security Notes
- JWT tokens include expiration time and are automatically cleared when expired
- Role information extracted from JWT payload (`ROLE_ADMIN`)
- Admin-only routes protected with `ProtectedRoute` component
- Backend endpoints enforce role-based access control with `@PreAuthorize`

## [Previous] - Unreleased

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

## [Latest] - BookDetails Layout Improvements

### Changed
- Moved Rating Distribution below book image in left column for better layout
- Reduced book image aspect ratio from 3:4 to 2:3 for more compact display
- Changed overall rating label format to "avg | totalRatings" (e.g., "3.5 | 322")
- Removed container max-width constraints for full-width utilization
- Removed redundant category badge, ratings count, and comments count below author name
- Removed separator line between book info and rating sections
- Rating Distribution now sits in same column as book image for space efficiency

## [Previous] - BookDetails Page Enhancements

### Added
- User profile menu in BookDetails page header for consistency
- Book description display on BookDetails page
- Authentication gate with blur overlay for rating feature
- Authentication gate with blur overlay for commenting feature
- Visual login prompts for non-authenticated users
- Pagination controls for comments (10 comments per page)
- Page navigation buttons (Previous/Next) with page counter
- Description property to Book interface and BookDto mapping

### Changed
- Fixed TypeScript errors in dropdown-menu.tsx (DropdownMenuLabel and DropdownMenuSeparator)
- Reduced book title size from text-4xl to text-2xl for better readability
- Moved Rating Distribution below "Rate this book" section
- Made Rating Distribution card more compact (reduced padding and font sizes)
- Separated book information and rating sections into distinct cards
- Comments now use proper pagination instead of loading all 50 at once
- Updated comment query keys to include page number for cache management
- Comment section resets to page 0 when new comment is added

### Technical Details
- Fixed return types in `src/components/ui/dropdown-menu.tsx`
- Updated `src/types/book.ts` to include description in Book interface
- Modified `src/services/bookService.ts` mapping to include description
- Updated `src/pages/BookDetails.tsx` with pagination state and controls
- Implemented proper backend pagination integration following Spring Boot Page structure
