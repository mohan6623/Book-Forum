// UI-friendly Book shape used by components
export interface Book {
  id: number;
  title: string;
  author: string;
  image: string; // resolved data URL assembled from imageType + base64
  rating: number; // average rating 0-5
  category: string;
  description?: string;
  comments?: number;
}

// Backend DTO shapes
export interface BookDto {
  id: number;
  title: string;
  description?: string;
  author: string;
  category: string;
  imageName?: string;
  imageType?: string; // e.g., image/png
  imageBase64?: string; // base64 without prefix
  averageRating?: number;
  noOfRatings?: number;
}

export interface CommentsDto {
  id: number;
  comment: string;
  bookId: number;
  username: string;
  createdAt: string; // ISO string
}

export type RatingsBreakdown = Record<number, number>; // {1..5 => count}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export type FilterOptions = {
  category: string[];
  authors: string[];
  rating: number; // Minimum rating filter (0, 1, 2, 3, 4, 5)
};

// Helpers to map backend DTOs to UI models
export function toImageUrl(dto: BookDto): string {
  if (dto.imageBase64 && dto.imageType) {
    return `data:${dto.imageType};base64,${dto.imageBase64}`;
  }
  return '';
}

export function mapBookDtoToBook(dto: BookDto): Book {
  return {
    id: dto.id,
    title: dto.title,
    author: dto.author,
    category: dto.category,
    image: toImageUrl(dto),
    rating: dto.averageRating ?? 0,
    description: dto.description,
  };
}
