import { Star } from "lucide-react";
import { Book } from "@/types/book";
import { Card } from "@/components/ui/card";

interface BookCardProps {
  book: Book;
  index: number;
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

const BookCard = ({ book, index }: BookCardProps) => {
  const categoryColorClass = categoryColors[book.category.toLowerCase()] || "bg-category-default";

  return (
    <Card
      className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-500 hover:shadow-hover cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
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
      </div>

      {/* Book Info */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {book.author}
          </p>
        </div>

        {/* Rating Display */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(book.rating)
                    ? "fill-secondary text-secondary"
                    : "text-muted-foreground/30"
                } transition-colors duration-300`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {book.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-primary/5 to-secondary/5" />
    </Card>
  );
};

export default BookCard;
