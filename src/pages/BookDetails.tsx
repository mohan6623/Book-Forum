import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ArrowLeft, MessageSquare, TrendingUp, User, Clock } from "lucide-react";
import { bookService } from "@/services/bookService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
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
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const isAuthenticated = authService.isAuthenticated();

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

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", bookId],
    queryFn: () => bookService.getComments(bookId, 0, 50),
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
      queryClient.invalidateQueries({ queryKey: ["comments", bookId] });
      setNewComment("");
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
      queryClient.invalidateQueries({ queryKey: ["comments", bookId] });
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
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Book Image & Rating */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden sticky top-24">
              <div className="relative aspect-[3/4] bg-muted">
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
                    {book.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 5</span>
                </div>
              </div>

              {/* Rate This Book */}
              <div className="p-6">
                <h3 className="font-semibold mb-3 text-foreground">Rate this book</h3>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => {
                        if (isAuthenticated) {
                          setUserRating(star);
                          setShowRatingDialog(true);
                        } else {
                          toast({
                            title: "Authentication required",
                            description: "Please log in to rate this book.",
                            variant: "destructive",
                          });
                        }
                      }}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
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
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground">
                    Please log in to rate this book
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Details, Ratings, Comments */}
          <div className="lg:col-span-2 space-y-8">
            {/* Book Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {book.title}
                </h1>
                <p className="text-xl text-muted-foreground">by {book.author}</p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" className="text-sm">
                  {book.category}
                </Badge>
                {totalRatings > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
                  </span>
                )}
                {commentsData?.totalElements ? (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {commentsData.totalElements}{" "}
                    {commentsData.totalElements === 1 ? "comment" : "comments"}
                  </span>
                ) : null}
              </div>
            </div>

            <Separator />

            {/* Ratings Breakdown */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Rating Distribution
                </h2>
              </div>

              {totalRatings > 0 ? (
                <div className="space-y-3">
                  {ratingPercentages.map(({ stars, count, percentage }) => (
                    <div key={stars} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-sm font-medium">{stars}</span>
                        <Star className="h-4 w-4 fill-secondary text-secondary" />
                      </div>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No ratings yet. Be the first to rate this book!
                </p>
              )}
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
              <div className="mb-8">
                <Textarea
                  placeholder={
                    isAuthenticated
                      ? "Share your thoughts about this book..."
                      : "Please log in to comment"
                  }
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
