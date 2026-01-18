// Prefer env override (Vite) with sensible default for local Spring Boot
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.bookforum.app';

// console.log('Final API_BASE_URL:', API_BASE_URL);

export const API_ENDPOINTS = {
  // Book endpoints
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
  
  // User management endpoints
  REGISTER: '/api/register',
  LOGIN: '/api/login',
  REFRESH_TOKEN: '/api/user/refresh-token',
  USER_PROFILE: '/api/user/profile',
  UPDATE_USER: (userId: number) => `/api/user/${userId}`,
  UPDATE_USERNAME: '/api/user/update-Username',
  UPDATE_NAME: '/api/user/update-name',
  UPDATE_PROFILE_PIC: '/api/user/update-profile-pic',
  AVAILABLE_USERNAME: (username: string) => `/api/available/username?username=${encodeURIComponent(username)}`,
  AVAILABLE_MAIL: (mail: string) => `/api/available/mail?mail=${encodeURIComponent(mail)}`,
  
  // Email verification endpoints
  RESEND_VERIFICATION: '/api/resend-verification',
  VERIFY_EMAIL: '/api/validate/verify-email',
  
  // Password reset endpoints
  FORGOT_PASSWORD: '/api/forgot-password',
  VALIDATE_FORGOT_PASSWORD: '/api/validate/forgot-password',
  
  // OAuth2 endpoints
  OAUTH2_GOOGLE: '/oauth2/authorization/google',
  OAUTH2_GITHUB: '/oauth2/authorization/github',
  OAUTH_CALLBACK: '/api/oauth/callback',
  OAUTH_HEALTH: '/api/oauth/health',
  OAUTH_CONNECT: (provider: string) => `/api/oauth/connect/${provider}`,
  OAUTH_LINK: '/api/oauth/link',
  OAUTH_DISCONNECT: (provider: string) => `/api/oauth/disconnect/${provider}`,
  
  // Filter metadata endpoints
  GET_CATEGORIES: '/api/book/categories',
  GET_AUTHORS: '/api/book/authors',
  
  // Admin endpoints
  ADMIN_RATE_LIMIT_STATUS: '/api/admin/rate-limit-status',
} as const;
