import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Book as BookIcon, Sparkles, ArrowUpDown, Check } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import BookCard from "@/components/BookCard";
import FilterPanel from "@/components/FilterPanel";
import { bookService } from "@/services/bookService";
import { FilterOptions } from "@/types/book";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    authors: [],
    rating: 0,
  });
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle scroll to move search bar to header
  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 200;
      // Only update state when value changes to avoid unnecessary re-renders while scrolling
      setIsScrolled((prev) => (prev !== next ? next : prev));
    };

    handleScroll(); // Check initial scroll position
    window.addEventListener('scroll', handleScroll, { passive: true } as AddEventListenerOptions);
    return () => window.removeEventListener('scroll', handleScroll as EventListener);
  }, []);

  // Fetch books from backend with infinite scroll
  const trimmedQuery = debouncedQuery.trim();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["books", trimmedQuery],
    queryFn: ({ pageParam }) => {
      const page = pageParam ?? 0;
      if (trimmedQuery) {
        return bookService.searchBooks(trimmedQuery, trimmedQuery, trimmedQuery, page, 18);
      }
      return bookService.getBooks(page, 18);
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page?.number ?? 0;
      const totalPages = lastPage.page?.totalPages ?? 1;
      const isLast = currentPage >= totalPages - 1;
      return isLast ? undefined : currentPage + 1;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const allBooks = useMemo(() => {
    return data?.pages.flatMap((page) => page.content) || [];
  }, [data]);

  // Filter logic
  const filteredBooks = useMemo(() => {
    if (!allBooks.length) return [];
    
    return allBooks.filter((book) => {
      // Category filter
      const matchesCategory =
        filters.category.length === 0 ||
        filters.category.includes(book.category);

      // Author filter
      const matchesAuthor =
        filters.authors.length === 0 ||
        filters.authors.includes(book.author);

      // Rating filter
      const matchesRating = filters.rating === 0 || book.rating >= filters.rating;

      return matchesCategory && matchesAuthor && matchesRating;
    });
  }, [allBooks, filters]);

  // Sort logic
  const sortedBooks = useMemo(() => {
    const books = [...filteredBooks];
    
    switch (sortBy) {
      case "title-asc":
        return books.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return books.sort((a, b) => b.title.localeCompare(a.title));
      case "author-asc":
        return books.sort((a, b) => a.author.localeCompare(b.author));
      case "author-desc":
        return books.sort((a, b) => b.author.localeCompare(a.author));
      case "rating-high":
        return books.sort((a, b) => b.rating - a.rating);
      case "rating-low":
        return books.sort((a, b) => a.rating - b.rating);
      case "category":
        return books.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return books;
    }
  }, [filteredBooks, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px 0px', threshold: 0 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isScrolled={isScrolled}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterToggle={() => setIsFilterOpen(true)}
      />
      
      {/* Hero Section */}
  <header className="relative overflow-hidden bg-gradient-hero border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--secondary)/0.08),transparent_50%)]" />
        
  <div className="relative container mx-auto px-2 sm:px-3 py-16 sm:py-24">
          <div className="text-center space-y-6 mb-12">
            <div className="flex items-center justify-center gap-3 animate-fade-in">
              <BookIcon className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-float" />
              <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                Book Forum
              </h1>
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-secondary animate-float" style={{ animationDelay: "1s" }} />
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              Discover your next favorite read from our curated collection
            </p>
          </div>

          <div 
            className={`w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out ${
              isScrolled ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
            }`}
          >
            {!isScrolled && (
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onFilterToggle={() => setIsFilterOpen(true)}
                autoFocus={true}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
  <main className="container mx-auto px-2 sm:px-3 py-12">
        {/* Results Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {trimmedQuery ? "Search Results" : "All Books"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {sortedBooks.length} {sortedBooks.length === 1 ? "book" : "books"} found
            </p>
          </div>
          
          {/* Sort Button & Sheet */}
          <Sheet open={isSortOpen} onOpenChange={setIsSortOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-lg">Sort Books</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-1">
                {[
                  { value: "default", label: "Default" },
                  { value: "title-asc", label: "Title (A-Z)" },
                  { value: "title-desc", label: "Title (Z-A)" },
                  { value: "author-asc", label: "Author (A-Z)" },
                  { value: "author-desc", label: "Author (Z-A)" },
                  { value: "rating-high", label: "Rating (High to Low)" },
                  { value: "rating-low", label: "Rating (Low to High)" },
                  { value: "category", label: "Category" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-all ${
                      sortBy === option.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 animate-fade-in">
            <BookIcon className="h-20 w-20 text-destructive mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">Failed to load books</h3>
            <p className="text-muted-foreground">
              Make sure your Spring Boot backend is running on http://book-forum.ap-south-1.elasticbeanstalk.com/
            </p>
          </div>
        ) : sortedBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sortedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            
            {/* Loading more skeletons during infinite scroll */}
            {isFetchingNextPage && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-6">
                {[...Array(6)].map((_, i) => (
                  <div key={`more-${i}`} className="space-y-2">
                    <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Load more trigger - invisible */}
            <div ref={loadMoreRef} className="h-20" />
            
            {/* End message */}
            {!hasNextPage && sortedBooks.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">You've reached the end</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <BookIcon className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">No books found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </main>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  );
};

export default Index;
