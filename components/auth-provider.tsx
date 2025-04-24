"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserWithProfile, getCurrentUser } from "@/lib/supabase/auth";

type AuthContextType = {
  user: UserWithProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Check if we need to redirect based on auth state
      const isAuthPage = pathname === '/' || pathname === '/auth/login' || pathname === '/auth/register';
      const isStudentPage = pathname?.startsWith('/student') ?? false;
      const isTeacherPage = pathname?.startsWith('/teacher') ?? false;
      
      if (currentUser) {
        if (isAuthPage) {
          if (currentUser.role === 'student') {
            router.push('/student/dashboard');
          } else if (currentUser.role === 'teacher') {
            router.push('/teacher/dashboard');
          }
        } else if (isStudentPage && currentUser.role !== 'student') {
          router.push('/teacher/dashboard');
        } else if (isTeacherPage && currentUser.role !== 'teacher') {
          router.push('/student/dashboard');
        }
      } else if (!isAuthPage) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const refresh = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};