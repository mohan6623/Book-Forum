import { useState, useMemo } from "react";
import { Book as BookIcon, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import BookCard from "@/components/BookCard";
import FilterPanel from "@/components/FilterPanel";
import { mockBooks } from "@/data/mockBooks";
import { FilterOptions } from "@/types/book";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    minRating: 0,
    maxRating: 5,
  });

  // Filter and search logic
  const filteredBooks = useMemo(() => {
    return mockBooks.filter((book) => {
      // Search filter
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        filters.category.length === 0 ||
        filters.category.includes(book.category);

      // Rating filter
      const matchesRating =
        book.rating >= filters.minRating && book.rating <= filters.maxRating;

      return matchesSearch && matchesCategory && matchesRating;
    });
  }, [searchQuery, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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

          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterToggle={() => setIsFilterOpen(true)}
          />
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
        {filteredBooks.length > 0 ? (
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
