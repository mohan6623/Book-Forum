import { BookIcon } from "lucide-react";
import SearchBar from "./SearchBar";
import UserProfileMenu from "./UserProfileMenu";

interface HeaderProps {
  isScrolled?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onFilterToggle?: () => void;
}

const Header = ({ isScrolled, searchQuery, onSearchChange, onFilterToggle }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <BookIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            Book Forum
          </h1>
        </div>

        <div 
          className={`flex-1 max-w-3xl mx-4 transition-all duration-300 ease-in-out ${
            isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none absolute'
          }`}
        >
          {isScrolled && searchQuery !== undefined && onSearchChange && onFilterToggle && (
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onFilterToggle={onFilterToggle}
            />
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
