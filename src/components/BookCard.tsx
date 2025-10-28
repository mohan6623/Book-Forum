import { Star } from "lucide-react";
import { Book } from "@/types/book";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface BookCardProps {
  book: Book;
}

const categoryColors: Record<string, string> = {
  fiction: "bg-category-fiction",
  mystery: "bg-category-mystery",
  romance: "bg-category-romance",
  scifi: "bg-category-scifi",
  fantasy: "bg-category-fantasy",
  biography: "bg-category-biography",
  history: "bg-category-history",
};

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();
  const categoryColorClass = categoryColors[book.category.toLowerCase()] || "bg-category-default";

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-500 hover:shadow-hover cursor-pointer"
    >
      {/* Category Badge */}
      <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryColorClass} shadow-lg backdrop-blur-sm`}>
        {book.category}
      </div>

      {/* Book Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={book.image}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Rating Badge - Bottom Left */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border border-border/50">
          <Star className="h-3 w-3 fill-secondary text-secondary" />
          <span className="text-xs font-bold text-foreground">
            {book.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Book Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {book.author}
        </p>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 to-secondary/5" />
    </Card>
  );
};

export default BookCard;
