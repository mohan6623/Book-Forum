import { X, Star, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterOptions } from "@/types/book";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const categories = [
  "Fiction",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Fantasy",
  "Biography",
  "History",
  "Thriller",
  "Self-Help",
  "Science",
  "Non-Fiction",
];

const authors = [
  "Andy Weir",
  "Alex Michaelides",
  "C.S. Lewis",
  "Cormac McCarthy",
  "Don Rosa",
  "J.K. Rowling",
  "Stephen King",
  "George R.R. Martin",
  "Agatha Christie",
];

const ratingOptions = [
  { value: 5, label: "5+ Stars" },
  { value: 4, label: "4+ Stars" },
  { value: 3, label: "3+ Stars" },
  { value: 2, label: "2+ Stars" },
  { value: 1, label: "1+ Stars" },
];

const FilterPanel = ({ isOpen, onClose, filters, onFilterChange }: FilterPanelProps) => {
  const [categorySearch, setCategorySearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter((c) => c !== category)
      : [...filters.category, category];
    onFilterChange({ ...filters, category: newCategories });
  };

  const handleAuthorToggle = (author: string) => {
    const newAuthors = filters.authors.includes(author)
      ? filters.authors.filter((a) => a !== author)
      : [...filters.authors, author];
    onFilterChange({ ...filters, authors: newAuthors });
  };

  const handleRatingChange = (value: string) => {
    onFilterChange({ ...filters, rating: parseInt(value) });
  };

  const handleRemoveCategory = (category: string) => {
    onFilterChange({ ...filters, category: filters.category.filter((c) => c !== category) });
  };

  const handleRemoveAuthor = (author: string) => {
    onFilterChange({ ...filters, authors: filters.authors.filter((a) => a !== author) });
  };

  const handleRemoveRating = () => {
    onFilterChange({ ...filters, rating: 0 });
  };

  const handleClearAll = () => {
    onFilterChange({ category: [], authors: [], rating: 0 });
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredAuthors = authors.filter((author) =>
    author.toLowerCase().includes(authorSearch.toLowerCase())
  );

  const hasActiveFilters = filters.category.length > 0 || filters.authors.length > 0 || filters.rating > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[900px] bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right shadow-elegant">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-xl font-semibold text-foreground">Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border">
              {filters.category.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="pl-3 pr-2 py-1.5 text-sm bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-0"
                >
                  {cat}
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.authors.map((author) => (
                <Badge
                  key={author}
                  variant="secondary"
                  className="pl-3 pr-2 py-1.5 text-sm bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border-0"
                >
                  {author}
                  <button
                    onClick={() => handleRemoveAuthor(author)}
                    className="ml-2 hover:bg-purple-200 dark:hover:bg-purple-900 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.rating > 0 && (
                <Badge
                  variant="secondary"
                  className="pl-3 pr-2 py-1.5 text-sm bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 border-0"
                >
                  Rating: {filters.rating}+ Stars
                  <button
                    onClick={handleRemoveRating}
                    className="ml-2 hover:bg-yellow-200 dark:hover:bg-yellow-900 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="link"
                onClick={handleClearAll}
                className="text-sm text-muted-foreground hover:text-foreground px-2"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Filter Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Categories */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                Categories
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {filteredCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={filters.category.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                      className="border-border data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label
                      htmlFor={`cat-${category}`}
                      className="text-sm font-normal text-foreground cursor-pointer hover:text-primary transition-colors flex-1"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                <div className="w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                Rating
              </div>
              <RadioGroup value={filters.rating.toString()} onValueChange={handleRatingChange}>
                <div className="space-y-2 pt-2">
                  {ratingOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`rating-${option.value}`}
                        className="border-border text-yellow-600 dark:text-yellow-400"
                      />
                      <Label
                        htmlFor={`rating-${option.value}`}
                        className="text-sm font-normal text-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Authors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" />
                Authors
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search authors..."
                  value={authorSearch}
                  onChange={(e) => setAuthorSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {filteredAuthors.map((author) => (
                  <div key={author} className="flex items-center space-x-2">
                    <Checkbox
                      id={`author-${author}`}
                      checked={filters.authors.includes(author)}
                      onCheckedChange={() => handleAuthorToggle(author)}
                      className="border-border data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <Label
                      htmlFor={`author-${author}`}
                      className="text-sm font-normal text-foreground cursor-pointer hover:text-primary transition-colors flex-1"
                    >
                      {author}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
