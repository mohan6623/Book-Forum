import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import BookDetails from "./pages/BookDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminPanel from "./pages/AdminPanel";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import OAuth2Redirect from "./pages/OAuth2Redirect";
import OAuth2Success from "./pages/OAuth2Success";
import OAuth2ConnectSuccess from "./pages/OAuth2ConnectSuccess";
import OAuth2Failure from "./pages/OAuth2Failure";
import OAuthEmailRequired from "./pages/OAuthEmailRequired";
import OAuthCompleteRegistration from "./pages/OAuthCompleteRegistration";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SpeedInsights />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/book/:id" element={<BookDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
              <Route path="/oauth2/success" element={<OAuth2Success />} />
              <Route path="/oauth2/connect-success" element={<OAuth2ConnectSuccess />} />
              <Route path="/oauth2/failure" element={<OAuth2Failure />} />
              <Route path="/oauth2/email-required" element={<OAuthEmailRequired />} />
              <Route path="/oauth2/complete-registration" element={<OAuthCompleteRegistration />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
