// Prefer env override (Vite) with sensible default for local Spring Boot
export const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const API_ENDPOINTS = {
  BOOKS: '/books',
  BOOK_BY_ID: (id: number) => `/bookid/${id}`,
  SEARCH_BOOKS: '/books/search',
  ADD_BOOK: '/addbook',
  UPDATE_BOOK: (id: number) => `/book/${id}`,
  DELETE_BOOK: (id: number) => `/book/${id}`,
  ADD_RATING: (id: number) => `/rating/${id}`,
  GET_RATINGS: (id: number) => `/book/${id}/ratings`,
  GET_COMMENTS: (id: number) => `/book/${id}/comment`,
  ADD_COMMENT: (id: number) => `/comment/${id}`,
  UPDATE_COMMENT: (id: number) => `/comment/${id}`,
  DELETE_COMMENT: (commentId: number) => `/comment/${commentId}`,
  UPDATE_USER: (userId: number) => `/user/${userId}`,
} as const;
