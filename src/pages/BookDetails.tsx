import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ArrowLeft, MessageSquare, TrendingUp, User, Clock, LogIn } from "lucide-react";
import { bookService } from "@/services/bookService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileMenu from "@/components/UserProfileMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryColors: Record<string, string> = {
  fiction: "bg-category-fiction",
  mystery: "bg-category-mystery",
  romance: "bg-category-romance",
  scifi: "bg-category-scifi",
  fantasy: "bg-category-fantasy",
  biography: "bg-category-biography",
  history: "bg-category-history",
};

const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [currentCommentPage, setCurrentCommentPage] = useState(0);

  const bookId = parseInt(id || "0");

  // Fetch book details
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => bookService.getBookById(bookId),
    enabled: bookId > 0,
  });

  // Fetch ratings breakdown
  const { data: ratingsBreakdown } = useQuery({
    queryKey: ["ratings", bookId],
    queryFn: () => bookService.getRatings(bookId),
    enabled: bookId > 0,
  });

  // Fetch comments with pagination
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", bookId, currentCommentPage],
    queryFn: () => bookService.getComments(bookId, currentCommentPage, 10),
    enabled: bookId > 0,
  });

  // Add rating mutation
  const addRatingMutation = useMutation({
    mutationFn: (rating: number) => bookService.addRating(bookId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      queryClient.invalidateQueries({ queryKey: ["ratings", bookId] });
      toast({
        title: "Rating submitted!",
        description: "Thank you for rating this book.",
      });
      setShowRatingDialog(false);
      setUserRating(0);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (comment: string) => bookService.addComment(bookId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", bookId, currentCommentPage] });
      setNewComment("");
      setCurrentCommentPage(0);
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => bookService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", bookId, currentCommentPage] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      });
    },
  });

  const handleSubmitRating = () => {
    if (userRating > 0) {
      addRatingMutation.mutate(userRating);
    }
  };

  const handleSubmitComment = () => {
    if (newComment.trim() && isAuthenticated) {
      addCommentMutation.mutate(newComment.trim());
    } else if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to post a comment.",
        variant: "destructive",
      });
    }
  };

  // Calculate rating statistics
  const totalRatings = ratingsBreakdown
    ? Object.values(ratingsBreakdown).reduce((sum, count) => sum + count, 0)
    : 0;

  const ratingPercentages = ratingsBreakdown
    ? Object.entries(ratingsBreakdown)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))
        .map(([stars, count]) => ({
          stars: parseInt(stars),
          count,
          percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0,
        }))
    : [];

  const categoryColorClass =
    categoryColors[book?.category.toLowerCase() || ""] || "bg-category-default";

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Book not found</h2>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Button>
          <UserProfileMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Book Image & Rating Distribution */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-[2/3] bg-muted">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                {/* Category Badge */}
                <div
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryColorClass} shadow-lg`}
                >
                  {book.category}
                </div>
                {/* Average Rating Badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-3 py-2 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border border-border/50">
                  <Star className="h-5 w-5 fill-secondary text-secondary" />
                  <span className="text-lg font-bold text-foreground">
                    {book.rating.toFixed(1)} | {totalRatings}
                  </span>
                </div>
              </div>
            </Card>

            {/* Ratings Breakdown */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Rating Distribution
                </h3>
              </div>

              {totalRatings > 0 ? (
                <div className="space-y-2">
                  {ratingPercentages.map(({ stars, count, percentage }) => (
                    <div key={stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-xs font-medium">{stars}</span>
                        <Star className="h-3 w-3 fill-secondary text-secondary" />
                      </div>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                      <span className="text-xs text-muted-foreground w-14 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  No ratings yet. Be the first to rate this book!
                </p>
              )}
            </Card>
          </div>

          {/* Right Column - Details, Ratings, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Book Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-muted-foreground">by {book.author}</p>
              </div>


              {/* Book Description */}
              {book.description && (
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}
            </div>

            {/* Rate This Book */}
            <Card className="p-6 relative">
              {!isAuthenticated && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <LogIn className="h-10 w-10 text-primary mx-auto mb-3" />
                    <p className="text-foreground font-semibold mb-2">Sign in to rate this book</p>
                    <p className="text-sm text-muted-foreground">Create an account or log in to share your rating</p>
                  </div>
                </div>
              )}
              <h3 className="font-semibold mb-3 text-foreground">Rate this book</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      if (isAuthenticated) {
                        setUserRating(star);
                        setShowRatingDialog(true);
                      }
                    }}
                    onMouseEnter={() => isAuthenticated && setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                    disabled={!isAuthenticated}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoveredRating || userRating)
                          ? "fill-secondary text-secondary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Discussion
                </h2>
              </div>

              {/* Add Comment */}
              <div className="mb-8 relative">
                {!isAuthenticated && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LogIn className="h-10 w-10 text-primary mx-auto mb-3" />
                      <p className="text-foreground font-semibold mb-2">Sign in to comment</p>
                      <p className="text-sm text-muted-foreground">Join the discussion about this book</p>
                    </div>
                  </div>
                )}
                <Textarea
                  placeholder="Share your thoughts about this book..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!isAuthenticated}
                  className="mb-3 min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending || !isAuthenticated}
                  >
                    {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading comments...</p>
                </div>
              ) : commentsData?.content && commentsData.content.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {commentsData.content.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {comment.username}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(comment.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap pl-10">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {commentsData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentCommentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentCommentPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentCommentPage + 1} of {commentsData.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentCommentPage(prev => Math.min(commentsData.totalPages - 1, prev + 1))}
                        disabled={currentCommentPage >= commentsData.totalPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Rating Confirmation Dialog */}
      <AlertDialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rate this book</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to rate "{book.title}" with {userRating} star
              {userRating !== 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserRating(0)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitRating}>
              Submit Rating
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BookDetails;
