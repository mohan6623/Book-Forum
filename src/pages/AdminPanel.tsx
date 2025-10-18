import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, BookPlus, BookOpen } from 'lucide-react';
import { bookService } from '@/services/bookService';
import { BookDto } from '@/types/book';

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Add Book State
  const [newBook, setNewBook] = useState<Partial<BookDto>>({
    title: '',
    author: '',
    description: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Update Book State
  const [updateBookId, setUpdateBookId] = useState('');
  const [updateBook, setUpdateBook] = useState<Partial<BookDto>>({
    title: '',
    author: '',
    description: '',
    category: '',
  });
  const [updateImageFile, setUpdateImageFile] = useState<File | null>(null);

  // Delete Book State
  const [deleteBookId, setDeleteBookId] = useState('');

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast({
        title: 'Image required',
        description: 'Please select an image for the book.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await bookService.addBook(newBook, imageFile);
      toast({
        title: 'Success!',
        description: 'Book added successfully.',
      });
      setNewBook({ title: '', author: '', description: '', category: '' });
      setImageFile(null);
      // Reset file input
      const fileInput = document.getElementById('add-book-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: 'Failed to add book',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateBookId) {
      toast({
        title: 'Book ID required',
        description: 'Please enter a book ID.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await bookService.updateBook(Number(updateBookId), updateBook, updateImageFile || undefined);
      toast({
        title: 'Success!',
        description: 'Book updated successfully.',
      });
      setUpdateBookId('');
      setUpdateBook({ title: '', author: '', description: '', category: '' });
      setUpdateImageFile(null);
      const fileInput = document.getElementById('update-book-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast({
        title: 'Failed to update book',
        description: 'Please check the book ID and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteBookId) {
      toast({
        title: 'Book ID required',
        description: 'Please enter a book ID.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await bookService.deleteBook(Number(deleteBookId));
      toast({
        title: 'Success!',
        description: 'Book deleted successfully.',
      });
      setDeleteBookId('');
    } catch (error) {
      toast({
        title: 'Failed to delete book',
        description: 'Please check the book ID and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage books and content</p>
        </div>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add" className="gap-2">
              <BookPlus className="h-4 w-4" />
              Add Book
            </TabsTrigger>
            <TabsTrigger value="update" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Update Book
            </TabsTrigger>
            <TabsTrigger value="delete" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Delete Book
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add New Book</CardTitle>
                <CardDescription>Fill in the details to add a new book to the collection</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-title">Title *</Label>
                    <Input
                      id="add-title"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-author">Author *</Label>
                    <Input
                      id="add-author"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-category">Category *</Label>
                    <Select
                      value={newBook.category}
                      onValueChange={(value) => setNewBook({ ...newBook, category: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="add-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiction">Fiction</SelectItem>
                        <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                        <SelectItem value="Fantasy">Fantasy</SelectItem>
                        <SelectItem value="Mystery">Mystery</SelectItem>
                        <SelectItem value="Romance">Romance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-description">Description</Label>
                    <Textarea
                      id="add-description"
                      value={newBook.description}
                      onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                      rows={4}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-book-image">Book Image *</Label>
                    <Input
                      id="add-book-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Book...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Add Book
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="update">
            <Card>
              <CardHeader>
                <CardTitle>Update Book</CardTitle>
                <CardDescription>Enter the book ID and update the fields you want to change</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateBook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-book-id">Book ID *</Label>
                    <Input
                      id="update-book-id"
                      type="number"
                      value={updateBookId}
                      onChange={(e) => setUpdateBookId(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Enter book ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-title">Title</Label>
                    <Input
                      id="update-title"
                      value={updateBook.title}
                      onChange={(e) => setUpdateBook({ ...updateBook, title: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-author">Author</Label>
                    <Input
                      id="update-author"
                      value={updateBook.author}
                      onChange={(e) => setUpdateBook({ ...updateBook, author: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-category">Category</Label>
                    <Select
                      value={updateBook.category}
                      onValueChange={(value) => setUpdateBook({ ...updateBook, category: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="update-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiction">Fiction</SelectItem>
                        <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Biography">Biography</SelectItem>
                        <SelectItem value="Fantasy">Fantasy</SelectItem>
                        <SelectItem value="Mystery">Mystery</SelectItem>
                        <SelectItem value="Romance">Romance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-description">Description</Label>
                    <Textarea
                      id="update-description"
                      value={updateBook.description}
                      onChange={(e) => setUpdateBook({ ...updateBook, description: e.target.value })}
                      rows={4}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-book-image">Book Image (optional)</Label>
                    <Input
                      id="update-book-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUpdateImageFile(e.target.files?.[0] || null)}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Book...
                      </>
                    ) : (
                      'Update Book'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delete">
            <Card>
              <CardHeader>
                <CardTitle>Delete Book</CardTitle>
                <CardDescription>Enter the book ID to permanently delete it from the collection</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeleteBook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-book-id">Book ID *</Label>
                    <Input
                      id="delete-book-id"
                      type="number"
                      value={deleteBookId}
                      onChange={(e) => setDeleteBookId(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="Enter book ID to delete"
                    />
                  </div>
                  <Button type="submit" variant="destructive" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting Book...
                      </>
                    ) : (
                      'Delete Book'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
