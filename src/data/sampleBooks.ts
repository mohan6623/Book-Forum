import { BookDto, CommentsDto, RatingsBreakdown } from '@/types/book';

// Sample book data for testing when backend is unreachable
export const SAMPLE_BOOK_DTO: BookDto = {
  id: 999,
  title: "The Midnight Library",
  author: "Matt Haig",
  description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?",
  category: "Fiction",
  imageUrl: "https://images-na.ssl-images-amazon.com/images/I/81LRjG6nWrL.jpg", // Cloudinary URL placeholder
  imagePublicId: "sample_midnight_library",
  averageRating: 4.5,
  noOfRatings: 125,
};

export const SAMPLE_RATINGS_BREAKDOWN: RatingsBreakdown = {
  5: 75,
  4: 30,
  3: 15,
  2: 3,
  1: 2,
};

export const SAMPLE_COMMENTS: CommentsDto[] = [
  {
    id: 1,
    comment: "This book completely changed my perspective on life. The concept of the midnight library is so unique and thought-provoking!",
    bookId: 999,
    username: "bookworm_sarah",
    createdAt: "2025-10-15T14:30:00Z",
  },
  {
    id: 2,
    comment: "A beautiful exploration of regret, choices, and second chances. Matt Haig's writing is both profound and accessible.",
    bookId: 999,
    username: "reader_mike",
    createdAt: "2025-10-14T09:15:00Z",
  },
  {
    id: 3,
    comment: "I couldn't put this down! Every chapter made me reflect on my own life decisions. Highly recommend!",
    bookId: 999,
    username: "literary_emma",
    createdAt: "2025-10-12T16:45:00Z",
  },
  {
    id: 4,
    comment: "The philosophical aspects of this book are incredible. It's not just a story, it's an experience.",
    bookId: 999,
    username: "alex_reads",
    createdAt: "2025-10-10T11:20:00Z",
  },
  {
    id: 5,
    comment: "Perfect for anyone feeling stuck in life. This book reminds us that it's never too late to change your path.",
    bookId: 999,
    username: "book_enthusiast",
    createdAt: "2025-10-08T08:00:00Z",
  },
];

// Additional sample books for the list view
export const SAMPLE_BOOKS_DTO: BookDto[] = [
  SAMPLE_BOOK_DTO,
  {
    id: 998,
    title: "Atomic Habits",
    author: "James Clear",
    description: "An easy & proven way to build good habits & break bad ones",
    category: "Self-Help",
    imageUrl: "https://images-na.ssl-images-amazon.com/images/I/91bYsX41DVL.jpg", // Cloudinary URL placeholder
    imagePublicId: "sample_atomic_habits",
    averageRating: 4.8,
    noOfRatings: 200,
  },
  {
    id: 997,
    title: "Project Hail Mary",
    author: "Andy Weir",
    description: "A lone astronaut must save the earth from disaster in this incredible new science-based thriller",
    category: "Science Fiction",
    imageUrl: "https://images-na.ssl-images-amazon.com/images/I/91qJEV6xU3L.jpg", // Cloudinary URL placeholder
    imagePublicId: "sample_project_hail_mary",
    averageRating: 4.7,
    noOfRatings: 180,
  },
];
