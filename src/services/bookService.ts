import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import {
  Book,
  BookDto,
  CommentsDto,
  PageResponse,
  RatingsBreakdown,
  CategoryWithCount,
  AuthorWithCount,
  mapBookDtoToBook,
} from '@/types/book';
import { getAuthHeader } from '@/services/authService';
import { SAMPLE_BOOK_DTO, SAMPLE_BOOKS_DTO } from '@/data/sampleBooks';

export const bookService = {
  async getBooks(page: number = 0, size: number = 20): Promise<PageResponse<Book>> {
    // Ensure page is a valid number
    const validPage = typeof page === 'number' && !isNaN(page) ? page : 0;
    const validSize = typeof size === 'number' && !isNaN(size) ? size : 20;
    
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS}?page=${validPage}&size=${validSize}`);
      if (res.status === 204) {
        return emptyPageResponse<Book>();
      }
      if (!res.ok) throw new Error('Failed to fetch books');
      const data: PageResponse<BookDto> = await res.json();
      return mapPage(data, mapBookDtoToBook);
    } catch (error) {
      // Return sample books when backend is down
      return {
        content: SAMPLE_BOOKS_DTO.map(mapBookDtoToBook),
        page: {
          size: 20,
          number: 0,
          totalElements: SAMPLE_BOOKS_DTO.length,
          totalPages: 1,
        },
      };
    }
  },

  async getBookById(id: number): Promise<Book> {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_BY_ID(id)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized: Please log in to view book details');
        }
        throw new Error('Failed to fetch book');
      }
      const dto: BookDto = await res.json();
      return mapBookDtoToBook(dto);
    } catch (error) {
      // Return sample book with the requested ID
      return mapBookDtoToBook({ ...SAMPLE_BOOK_DTO, id });
    }
  },

  async searchBooks(
    title?: string,
    author?: string,
    category?: string,
    page: number = 0,
    size: number = 30
  ): Promise<PageResponse<Book>> {
    // Ensure page and size are valid numbers
    const validPage = typeof page === 'number' && !isNaN(page) ? page : 0;
    const validSize = typeof size === 'number' && !isNaN(size) ? size : 30;
    
    const params = new URLSearchParams({
      page: validPage.toString(),
      size: validSize.toString(),
    });
    
    if (title) params.append('title', title);
    if (author) params.append('author', author);
    if (category) params.append('category', category);

    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SEARCH_BOOKS}?${params.toString()}`);
    if (res.status === 204) return emptyPageResponse<Book>();
    if (!res.ok) throw new Error('Failed to search books');
    const data: PageResponse<BookDto> = await res.json();
    return mapPage(data, mapBookDtoToBook);
  },

  // Admin: add book (multipart)
  async addBook(book: Partial<BookDto>, imageFile: File): Promise<void> {
    const form = new FormData();
    // Send minimal Book as backend expects entity fields except image
    // Backend now handles Cloudinary upload, so we don't need imageName
    const payload = {
      id: book.id ?? 0,
      title: book.title ?? '',
      description: book.description ?? '',
      author: book.author ?? '',
      category: book.category ?? '',
    } as any;
    form.append('book', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    form.append('imageFile', imageFile);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADD_BOOK}`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: form,
    });
    if (!res.ok) throw new Error('Failed to add book');
  },

  // Admin: update book (multipart, image optional)
  async updateBook(id: number, book: Partial<BookDto>, imageFile?: File): Promise<void> {
    const form = new FormData();
    // Backend now handles Cloudinary upload/delete, no need for imageName
    const payload = {
      id,
      title: book.title ?? '',
      description: book.description ?? '',
      author: book.author ?? '',
      category: book.category ?? '',
    } as any;
    form.append('book', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (imageFile) form.append('imageFile', imageFile);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_BOOK(id)}`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
      body: form,
    });
    if (!res.ok) throw new Error('Failed to update book');
  },

  // Admin: delete
  async deleteBook(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_BOOK(id)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete book');
  },

  // Auth required: add rating
  async addRating(id: number, rating: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADD_RATING(id)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) throw new Error('Failed to add rating');
  },

  async getRatings(id: number): Promise<RatingsBreakdown> {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_RATINGS(id)}`);
      if (!res.ok) throw new Error('Failed to fetch ratings');
      return res.json();
    } catch (error) {
      const { SAMPLE_RATINGS_BREAKDOWN } = await import('@/data/sampleBooks');
      return SAMPLE_RATINGS_BREAKDOWN;
    }
  },

  async getComments(id: number, page = 0, size = 20) {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_COMMENTS(id)}?page=${page}&size=${size}`);
      if (res.status === 204) return emptyPageResponse<CommentsDto>();
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json() as Promise<PageResponse<CommentsDto>>;
    } catch (error) {
      const { SAMPLE_COMMENTS } = await import('@/data/sampleBooks');
      return {
        content: SAMPLE_COMMENTS,
        page: {
          size: size,
          number: 0,
          totalElements: SAMPLE_COMMENTS.length,
          totalPages: 1,
        },
      };
    }
  },

  async addComment(id: number, comment: string): Promise<CommentsDto> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADD_COMMENT(id)}` ,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ id: 0, bookId: id, comment, username: '', createdAt: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  async updateComment(id: number, commentDto: CommentsDto): Promise<CommentsDto> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_COMMENT(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(commentDto),
    });
    if (!res.ok) throw new Error('Failed to update comment');
    return res.json();
  },

  async deleteComment(commentId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_COMMENT(commentId)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete comment');
  },
};

export const filterMetadataService = {
  async getCategories(): Promise<CategoryWithCount[]> {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_CATEGORIES}`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return await res.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async getAuthors(): Promise<AuthorWithCount[]> {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_AUTHORS}`);
      if (!res.ok) throw new Error('Failed to fetch authors');
      return await res.json();
    } catch (error) {
      console.error('Error fetching authors:', error);
      return [];
    }
  },
};

// Helpers
function emptyPageResponse<T>(): PageResponse<T> {
  return {
    content: [],
    page: {
      size: 0,
      number: 0,
      totalElements: 0,
      totalPages: 0,
    },
  };
}

function mapPage<S, T>(page: PageResponse<S>, map: (s: S) => T): PageResponse<T> {
  return {
    ...page,
    content: page.content.map(map),
  } as unknown as PageResponse<T>;
}
