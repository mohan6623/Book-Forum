// Use relative API paths - Vercel will proxy to backend
export const API_BASE_URL = '/api';

export const API_ENDPOINTS = {
  BOOKS: '/books',
  BOOK_BY_ID: (id: number) => `/bookid/${id}`,
  SEARCH_BOOKS: '/books/search',
  ADD_BOOK: '/addbook',
  UPDATE_BOOK: (id: number) => `/book/${id}`,
  DELETE_BOOK: (id: number) => `/book/${id}`,
  // Backend exposes rating under the book resource: POST /book/{id}/rating
  ADD_RATING: (id: number) => `/book/${id}/rating`,
  GET_RATINGS: (id: number) => `/book/${id}/ratings`,
  GET_COMMENTS: (id: number) => `/book/${id}/comment`,
  // Comments are nested under the book resource in the backend
  ADD_COMMENT: (id: number) => `/book/${id}/comment`,
  UPDATE_COMMENT: (id: number) => `/book/${id}/comment`,
  DELETE_COMMENT: (commentId: number) => `/comment/${commentId}`,
  UPDATE_USER: (userId: number) => `/user/${userId}`,
  // User availability checks
  AVAILABLE_USERNAME: (username: string) => `/available/username?username=${encodeURIComponent(username)}`,
  AVAILABLE_MAIL: (mail: string) => `/available/mail?mail=${encodeURIComponent(mail)}`,
} as const;
