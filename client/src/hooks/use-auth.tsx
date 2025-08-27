import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, signupSchema } from "@shared/schema";
import { z } from "zod";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: z.infer<typeof loginSchema>) => Promise<void>;
  signup: (data: z.infer<typeof signupSchema>) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Include session cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setUser(data.data);
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.data.name}!`,
        });
      } else {
        throw new Error(data.error || "Login failed");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof signupSchema>) => {
      const response = await apiRequest("POST", "/api/auth/signup", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setUser(data.data);
        toast({
          title: "Signup successful",
          description: `Welcome to SACCO, ${data.data.name}!`,
        });
      } else {
        throw new Error(data.error || "Signup failed");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const login = async (credentials: z.infer<typeof loginSchema>) => {
    await loginMutation.mutateAsync(credentials);
  };

  const signup = async (data: z.infer<typeof signupSchema>) => {
    await signupMutation.mutateAsync(data);
  };

  const logout = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setUser(null);
        queryClient.clear(); // Clear all cached data
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}