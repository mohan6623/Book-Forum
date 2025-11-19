import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ArrowLeft, MessageSquare, TrendingUp, User, Clock, LogIn, Edit2, Trash2, X, Check } from "lucide-react";
import { bookService } from "@/services/bookService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { getBookDetailImage, getUserAvatarImage } from "@/lib/cloudinary";
import { useScrollRestoration, saveScrollPosition } from "@/hooks/useScrollRestoration";
// Rating dialog removed – direct click to rate/update

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
  useScrollRestoration();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [currentCommentPage, setCurrentCommentPage] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");

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

  // Persist and update a user's rating per book in localStorage to reflect prior choice on the client
  const ratingKey = `user_rating_${bookId}_${user?.id ?? user?.username ?? 'guest'}`;

  useEffect(() => {
    if (!isAuthenticated) return;
    const saved = localStorage.getItem(ratingKey);
    if (saved) {
      const r = Number(saved);
      if (!isNaN(r)) setUserRating(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingKey, isAuthenticated]);

  // Add or update rating mutation (backend should upsert). We short-circuit if clicking the same star again.
  const addRatingMutation = useMutation({
    mutationFn: (rating: number) => bookService.addRating(bookId, rating),
    onSuccess: (_data, rating) => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      queryClient.invalidateQueries({ queryKey: ["ratings", bookId] });
      setUserRating(rating);
      try { localStorage.setItem(ratingKey, String(rating)); } catch {}
      toast({
        title: "Rating saved",
        description: "You can update it anytime by clicking a different star.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save rating. Please try again.",
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

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, comment }: { commentId: number; comment: string }) => {
      const commentDto = {
        id: commentId,
        comment: comment,
        bookId: bookId,
        username: user?.username || "",
        createdAt: new Date().toISOString(),
      };
      return bookService.updateComment(commentId, commentDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", bookId, currentCommentPage] });
      setEditingCommentId(null);
      setEditedCommentText("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStarClick = (rating: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to rate this book.",
        variant: "destructive",
      });
      return;
    }
    // If selecting the same rating again, do nothing to avoid duplicate posts
    if (rating === userRating) return;
    addRatingMutation.mutate(rating);
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

  const handleEditComment = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  const handleSaveEdit = (commentId: number) => {
    if (editedCommentText.trim()) {
      updateCommentMutation.mutate({
        commentId,
        comment: editedCommentText.trim(),
      });
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  // Format relative time (e.g., "2 minutes ago", "3 hours ago")
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? "day" : "days"} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} ${years === 1 ? "year" : "years"} ago`;
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
      <div className="min-h-screen bg-background">
        <Header
          leftContent={
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Books
            </Button>
          }
        />
        <main className="w-full px-4 sm:px-6 py-8">
          <div className="mb-2" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-1 space-y-4">
              <div className="lg:sticky lg:top-20">
                <Card className="overflow-hidden max-w-sm mx-auto">
                  <div className="relative aspect-[2/3] bg-muted">
                    <Skeleton className="w-full h-full" />
                    {/* Category Badge Skeleton */}
                    <div className="absolute top-3 right-3">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Right Column Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {/* Book Info Skeleton */}
              <div className="space-y-2">
                <div>
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
                {/* Description Skeleton */}
                <div className="pt-2">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>

              {/* Rating Card Skeleton */}
              <Card className="p-4">
                <div className="mb-4">
                  <div className="flex gap-0 items-center">
                    {/* Overall Rating Skeleton */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-9 w-12" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    {/* Rating Bars Skeleton */}
                    <div className="flex-1 max-w-xs">
                      <div className="space-y-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center">
                            <Skeleton className="h-4 w-10" />
                            <Skeleton className="h-1.5 flex-1 ml-1 mr-4" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator className="mb-4" />
                {/* Rate This Book Skeleton */}
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-7 w-7 rounded-full" />
                    ))}
                  </div>
                </div>
              </Card>

              {/* Comments Card Skeleton */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-6 w-32" />
                </div>
                {/* Add Comment Skeleton */}
                <div className="mb-6">
                  <Skeleton className="h-24 w-full mb-3" />
                  <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
                {/* Comments List Skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-start gap-2 mb-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full ml-10" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
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
      {/* Consistent global header with Back button replacing brand */}
      <Header
        leftContent={
          <Button
            variant="ghost"
            onClick={() => {
              saveScrollPosition();
              navigate("/");
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Books
          </Button>
        }
      />

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 py-8">
        {/* Back button moved into header via leftContent; remove spacer */}
        <div className="mb-2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
          {/* Left Column - Book Image & Rating Distribution */}
          <div className="lg:col-span-1 space-y-4">
            <div className="lg:sticky lg:top-20">
              <Card className="overflow-hidden max-w-sm mx-auto">
                <div className="relative aspect-[2/3] bg-muted">
                  <img
                    src={getBookDetailImage(book.image)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Category Badge */}
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${categoryColorClass} shadow-lg`}
                  >
                    {book.category}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column - Details, Ratings, Comments */}
          <div className="lg:col-span-2 space-y-4">
            {/* Book Info */}
            <div className="space-y-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground leading-tight mb-1">
                  {book.title}
                </h1>
                <p className="text-base text-muted-foreground">by {book.author}</p>
              </div>


              {/* Book Description */}
              {book.description && (
                <div className="pt-2">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}
            </div>

            {/* Rate This Book with Rating Distribution */}
            <Card className="p-4 relative">
              {/* Rating Distribution */}
              {totalRatings > 0 ? (
                <div className="mb-4">
                  <div className="flex gap-0 items-center">
                    {/* Overall Rating */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center px-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl font-bold text-foreground">{book.rating.toFixed(1)}</span>
                        <Star className="h-6 w-6 fill-secondary text-secondary" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-tight text-center">
                        {totalRatings.toLocaleString()} Rating{totalRatings !== 1 ? 's' : ''} &
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight text-center">
                        {commentsData?.page?.totalElements || 0} Review{(commentsData?.page?.totalElements || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Rating Distribution Bars */}
                    <div className="flex-1 max-w-xs">
                      <div className="space-y-1">
                        {ratingPercentages.map(({ stars, count, percentage }) => {
                          // Determine color based on star rating
                          const barColor = stars === 5 || stars === 4 || stars === 3 
                            ? 'bg-green-500' 
                            : stars === 2 
                            ? 'bg-orange-500' 
                            : 'bg-red-500';
                          
                          return (
                            <div key={stars} className="flex items-center">
                              <div className="flex items-center gap-1 w-10">
                                <span className="text-xs font-medium">{stars}</span>
                                <Star className="h-3 w-3 fill-secondary text-secondary" />
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-1 lg:h-1.5 overflow-hidden ml-1 mr-4">
                                <div 
                                  className={`h-full ${barColor} transition-all duration-300`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-16">
                                {count.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 py-8">
                  <p className="text-muted-foreground text-center text-base">
                    No ratings yet. Be the first to rate this book!
                  </p>
                </div>
              )}

              <Separator className="mb-4" />

              {/* Rate This Book */}
              <div className="relative min-h-[80px]">
                {!isAuthenticated && (
                  <div 
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-background/90 transition-colors"
                    onClick={() => {
                      saveScrollPosition();
                      navigate('/login', { state: { from: window.location.pathname } });
                    }}
                  >
                    <div className="text-center px-3 py-2">
                      <LogIn className="h-6 w-6 text-primary mx-auto mb-1.5" />
                      <p className="text-sm font-semibold mb-1 leading-tight">Sign in to rate this book</p>
                      <p className="text-xs text-muted-foreground leading-tight">Log in to share your rating</p>
                    </div>
                  </div>
                )}
                <h3 className="text-base font-semibold mb-2 text-foreground">Rate this book</h3>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => isAuthenticated && setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                    disabled={!isAuthenticated || addRatingMutation.isPending}
                    aria-label={`Rate ${star} star${star>1?'s':''}`}
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoveredRating || userRating)
                          ? "fill-secondary text-secondary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              </div>
            </Card>

            {/* Comments Section */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  Discussion
                </h2>
              </div>

              {/* Add Comment */}
              <div className="mb-6 relative">
                {!isAuthenticated && (
                  <div 
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-background/90 transition-colors"
                    onClick={() => {
                      saveScrollPosition();
                      navigate('/login', { state: { from: window.location.pathname } });
                    }}
                  >
                    <div className="text-center px-3 py-2">
                      <LogIn className="h-6 w-6 text-primary mx-auto mb-1.5" />
                      <p className="text-sm font-semibold mb-1 leading-tight">Sign in to comment</p>
                      <p className="text-xs text-muted-foreground leading-tight">Join the discussion about this book</p>
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
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg border border-border bg-card">
                      <div className="flex items-start gap-2 mb-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full ml-10" />
                    </div>
                  ))}
                </div>
              ) : commentsData?.content && commentsData.content.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {commentsData.content.map((comment) => {
                      const isOwner = isAuthenticated && user?.username === comment.username;
                      const isEditing = editingCommentId === comment.id;
                      
                      return (
                        <div
                          key={comment.id}
                          className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                {comment.profilePic && (
                                  <AvatarImage 
                                    src={getUserAvatarImage(comment.profilePic)}
                                    alt={comment.username}
                                  />
                                )}
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {comment.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-base text-foreground">
                                  {comment.username}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  {getRelativeTime(comment.createdAt)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Edit and Delete buttons - only show for comment owner */}
                            {isOwner && !isEditing && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditComment(comment.id, comment.comment)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  disabled={deleteCommentMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Comment text or edit textarea */}
                          {isEditing ? (
                            <div className="pl-10 space-y-2">
                              <Textarea
                                value={editedCommentText}
                                onChange={(e) => setEditedCommentText(e.target.value)}
                                className="min-h-[80px]"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(comment.id)}
                                  disabled={!editedCommentText.trim() || updateCommentMutation.isPending}
                                  className="gap-1"
                                >
                                  <Check className="h-4 w-4" />
                                  {updateCommentMutation.isPending ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="gap-1"
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base text-foreground whitespace-pre-wrap pl-10">
                              {comment.comment}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {commentsData.page?.totalPages > 1 && (
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
                        Page {currentCommentPage + 1} of {commentsData.page.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentCommentPage(prev => Math.min(commentsData.page.totalPages - 1, prev + 1))}
                        disabled={currentCommentPage >= commentsData.page.totalPages - 1}
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

      {/* No dialog – clicking a star saves/updates the rating */}
    </div>
  );
};

export default BookDetails;
