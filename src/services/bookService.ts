import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import { Book, PageResponse } from '@/types/book';

export const bookService = {
  async getBooks(page: number = 0, size: number = 20): Promise<PageResponse<Book>> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.BOOKS}?page=${page}&size=${size}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }
    return response.json();
  },

  async getBookById(id: number): Promise<Book> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.BOOK_BY_ID(id)}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch book');
    }
    return response.json();
  },

  async searchBooks(
    title?: string,
    author?: string,
    category?: string,
    page: number = 0,
    size: number = 30
  ): Promise<PageResponse<Book>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (title) params.append('title', title);
    if (author) params.append('author', author);
    if (category) params.append('category', category);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.SEARCH_BOOKS}?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search books');
    }
    return response.json();
  },
};
