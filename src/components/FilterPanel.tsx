import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
];

const FilterPanel = ({ isOpen, onClose, filters, onFilterChange }: FilterPanelProps) => {
  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter((c) => c !== category)
      : [...filters.category, category];
    onFilterChange({ ...filters, category: newCategories });
  };

  const handleRatingChange = (values: number[]) => {
    onFilterChange({
      ...filters,
      minRating: values[0],
      maxRating: values[1],
    });
  };

  const handleReset = () => {
    onFilterChange({
      category: [],
      minRating: 0,
      maxRating: 5,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right shadow-elegant">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Categories</h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-3">
                  <Checkbox
                    id={category}
                    checked={filters.category.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={category}
                    className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Range */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Rating Range</h3>
            <div className="px-2 space-y-4">
              <Slider
                min={0}
                max={5}
                step={0.5}
                value={[filters.minRating, filters.maxRating]}
                onValueChange={handleRatingChange}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.minRating.toFixed(1)} stars</span>
                <span>{filters.maxRating.toFixed(1)} stars</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 border-border hover:bg-muted"
            >
              Reset
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
