import { ServerCrash, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ServerErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: "full" | "inline" | "compact";
}

export const ServerError = ({
  title = "Server Unavailable",
  message = "We're having trouble connecting to our servers. Please try again later.",
  onRetry,
  variant = "full",
}: ServerErrorProps) => {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
        <WifiOff className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{message}</p>
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="flex-shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <Card className="p-6 text-center bg-muted/30 border-dashed">
        <WifiOff className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
        <h4 className="text-lg font-medium text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </Card>
    );
  }

  // Full page variant
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
        <ServerCrash className="relative h-24 w-24 text-muted-foreground opacity-60" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 text-center">
        {title}
      </h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        <span>Service temporarily unavailable</span>
      </div>
    </div>
  );
};

export default ServerError;
