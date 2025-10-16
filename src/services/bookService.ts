import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';
import {
  Book,
  BookDto,
  CommentsDto,
  PageResponse,
  RatingsBreakdown,
  mapBookDtoToBook,
} from '@/types/book';
import { getAuthHeader } from '@/services/authService';

export const bookService = {
  async getBooks(page: number = 0, size: number = 20): Promise<PageResponse<Book>> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKS}?page=${page}&size=${size}`);
    if (res.status === 204) {
      return emptyPageResponse<Book>();
    }
    if (!res.ok) throw new Error('Failed to fetch books');
    const data: PageResponse<BookDto> = await res.json();
    return mapPage(data, mapBookDtoToBook);
  },

  async getBookById(id: number): Promise<Book> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOK_BY_ID(id)}`);
    if (!res.ok) throw new Error('Failed to fetch book');
    const dto: BookDto = await res.json();
    return mapBookDtoToBook(dto);
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
    const payload = {
      id: book.id ?? 0,
      title: book.title ?? '',
      description: book.description ?? '',
      author: book.author ?? '',
      category: book.category ?? '',
      imageName: imageFile.name,
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
    const payload = {
      id,
      title: book.title ?? '',
      description: book.description ?? '',
      author: book.author ?? '',
      category: book.category ?? '',
      imageName: imageFile?.name ?? book.imageName ?? '',
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
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_RATINGS(id)}`);
    if (!res.ok) throw new Error('Failed to fetch ratings');
    return res.json();
  },

  async getComments(id: number, page = 0, size = 20) {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_COMMENTS(id)}?page=${page}&size=${size}`);
    if (res.status === 204) return emptyPageResponse<CommentsDto>();
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json() as Promise<PageResponse<CommentsDto>>;
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

// Helpers
function emptyPageResponse<T>(): PageResponse<T> {
  return {
    content: [],
    pageable: { pageNumber: 0, pageSize: 0, offset: 0, paged: false, unpaged: true },
    totalPages: 0,
    totalElements: 0,
    last: true,
    size: 0,
    number: 0,
    numberOfElements: 0,
    first: true,
    empty: true,
  };
}

function mapPage<S, T>(page: PageResponse<S>, map: (s: S) => T): PageResponse<T> {
  return {
    ...page,
    content: page.content.map(map),
  } as unknown as PageResponse<T>;
}
