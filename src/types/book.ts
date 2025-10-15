export interface Book {
  id: number;
  title: string;
  author: string;
  image: string;
  rating: number;
  category: string;
  comments?: number;
}

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
  minRating: number;
  maxRating: number;
};
