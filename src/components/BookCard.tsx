import { memo, useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Book } from "@/types/book";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { saveScrollPosition } from "@/hooks/useScrollRestoration";

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

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const BookCard = ({ book }: BookCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const categoryColorClass = categoryColors[book.category?.toLowerCase() || ''] || "bg-category-default";
  const coverImage = book.image || FALLBACK_COVER;
  
  const [retryCount, setRetryCount] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    if (retryCount < MAX_RETRIES) {
      // Schedule a retry after delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageKey(prev => prev + 1); // Force image reload
      }, RETRY_DELAY);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setRetryCount(0); // Reset retry count on successful load
  };

  const handleClick = () => {
    // Save current scroll position before navigating
    saveScrollPosition();
    navigate(`/book/${book.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-500 hover:shadow-hover cursor-pointer cv-auto will-change-transform motion-reduce:transition-none"
    >
      {/* Category Badge */}
      <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryColorClass} shadow-lg backdrop-blur-sm`}>
        {book.category}
      </div>

      {/* Book Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        )}
        <img
          key={imageKey}
          src={coverImage}
          alt={book.title}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 transform-gpu will-change-transform motion-reduce:transform-none"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Rating Badge - Bottom Left (only show if rating exists) */}
        {book.rating != null && book.rating > 0 && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border border-border/50">
            <Star className="h-3 w-3 fill-secondary text-secondary" />
            <span className="text-xs font-bold text-foreground">
              {book.rating.toFixed(1)}
            </span>
          </div>
        )}
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

export default memo(BookCard);
