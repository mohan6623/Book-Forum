import { useState, useMemo, useEffect } from "react";
import { Book as BookIcon, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import BookCard from "@/components/BookCard";
import FilterPanel from "@/components/FilterPanel";
import { bookService } from "@/services/bookService";
import { FilterOptions } from "@/types/book";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    authors: [],
    rating: 0,
  });

  // Handle scroll to move search bar to header
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const searchBarThreshold = 200;
      setIsScrolled(scrollPosition > searchBarThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch books from backend
  const { data: booksData, isLoading, error } = useQuery({
    queryKey: ['books', searchQuery],
    queryFn: () => {
      if (searchQuery.trim()) {
        return bookService.searchBooks(searchQuery, searchQuery, searchQuery);
      }
      return bookService.getBooks(0, 100);
    },
  });

  // Filter logic
  const filteredBooks = useMemo(() => {
    if (!booksData?.content) return [];
    
    return booksData.content.filter((book) => {
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
  }, [booksData, filters]);

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
        
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
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
              isScrolled ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onFilterToggle={() => setIsFilterOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Results Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {searchQuery ? "Search Results" : "All Books"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"} found
            </p>
          </div>
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading books...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 animate-fade-in">
            <BookIcon className="h-20 w-20 text-destructive mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold text-foreground mb-2">Failed to load books</h3>
            <p className="text-muted-foreground">
              Make sure your Spring Boot backend is running on http://localhost:8080
            </p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBooks.map((book, index) => (
              <BookCard key={book.id} book={book} index={index} />
            ))}
          </div>
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
