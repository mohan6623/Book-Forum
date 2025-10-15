export interface Book {
  id: string;
  title: string;
  author: string;
  image: string;
  rating: number;
  category: string;
  comments?: number;
}

export type FilterOptions = {
  category: string[];
  minRating: number;
  maxRating: number;
};
