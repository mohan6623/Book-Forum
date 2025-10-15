import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFilterToggle: () => void;
}

const SearchBar = ({ searchQuery, onSearchChange, onFilterToggle }: SearchBarProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-12 animate-fade-in">
      <div className="relative flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by title, author, or category..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-4 h-14 text-lg bg-card border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={onFilterToggle}
          className="h-14 px-6 bg-card hover:bg-card-hover border-border hover:border-primary transition-all duration-300"
        >
          <SlidersHorizontal className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
