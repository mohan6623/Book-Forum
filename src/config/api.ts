// Prefer env override (Vite) with sensible default for local Spring Boot
export const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const API_ENDPOINTS = {
  BOOKS: '/api/books',
  BOOK_BY_ID: (id: number) => `/api/bookid/${id}`,
  SEARCH_BOOKS: '/api/books/search',
  ADD_BOOK: '/api/addbook',
  UPDATE_BOOK: (id: number) => `/api/book/${id}`,
  DELETE_BOOK: (id: number) => `/api/book/${id}`,
  // Backend exposes rating under the book resource: POST /book/{id}/rating
  ADD_RATING: (id: number) => `/api/book/${id}/rating`,
  GET_RATINGS: (id: number) => `/api/book/${id}/ratings`,
  GET_COMMENTS: (id: number) => `/api/book/${id}/comment`,
  // Comments are nested under the book resource in the backend
  ADD_COMMENT: (id: number) => `/api/book/${id}/comment`,
  UPDATE_COMMENT: (id: number) => `/api/book/${id}/comment`,
  DELETE_COMMENT: (commentId: number) => `/api/comment/${commentId}`,
  UPDATE_USER: (userId: number) => `/api/user/${userId}`,
  // User availability checks
  AVAILABLE_USERNAME: (username: string) => `/api/available/username?username=${encodeURIComponent(username)}`,
  AVAILABLE_MAIL: (mail: string) => `/api/available/mail?mail=${encodeURIComponent(mail)}`,
} as const;
