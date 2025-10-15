export const API_BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
  BOOKS: '/books',
  BOOK_BY_ID: (id: number) => `/bookid/${id}`,
  SEARCH_BOOKS: '/books/search',
  ADD_BOOK: '/addbook',
  UPDATE_BOOK: (id: number) => `/book/${id}`,
  DELETE_BOOK: (id: number) => `/book/${id}`,
  ADD_RATING: (id: number) => `/book/${id}/rating`,
  GET_RATINGS: (id: number) => `/book/${id}/ratings`,
  GET_COMMENTS: (id: number) => `/book/${id}/comment`,
  ADD_COMMENT: (id: number) => `/book/${id}/comment`,
  UPDATE_COMMENT: `/book/{id}/comment`,
  DELETE_COMMENT: (commentId: number) => `/comment/${commentId}`,
} as const;
