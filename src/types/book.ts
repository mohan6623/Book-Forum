// UI-friendly Book shape used by components
export interface Book {
  id: number;
  title: string;
  author: string;
  image: string; // Cloudinary URL from backend
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
  imageUrl?: string; // Cloudinary URL
  imagePublicId?: string; // Cloudinary public ID
  averageRating?: number;
  noOfRatings?: number;
}

export interface CommentsDto {
  id: number;
  comment: string;
  bookId: number;
  username: string;
  createdAt: string; // ISO string
  profilePic?: string; // User's profile picture URL from Cloudinary
}

export type RatingsBreakdown = Record<number, number>; // {1..5 => count}

// Spring Boot Page response structure - pagination info at root level
export interface PageResponse<T> {
  content: T[];
  size: number;
  number: number; // current page number (0-indexed)
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type FilterOptions = {
  category: string[];
  authors: string[];
  rating: number; // Minimum rating filter (0, 1, 2, 3, 4, 5)
};

// Dynamic filter metadata from backend
export interface CategoryWithCount {
  category: string;
  counts: number;
}

export interface AuthorWithCount {
  author: string;
  counts: number;
}

// Helpers to map backend DTOs to UI models
export function toImageUrl(dto: BookDto): string {
  // Backend now returns Cloudinary URLs directly
  return dto.imageUrl || '';
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
