import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

type SessionUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin" | "instructor";
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  country: string | null;
  phone: string | null;
  englishLevel: string | null;
  learningGoal: string | null;
  createdAt: Date | string;
};

type AuthValue = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
  const logoutMutation = trpc.auth.logout.useMutation();

  const clearPrivateData = useCallback(async () => {
    const filters = {
      predicate: (query: { queryKey: readonly unknown[] }) => {
        const prefix = query.queryKey[0];
        return (
          Array.isArray(prefix) &&
          [
            "homework",
            "admin",
            "learning",
            "billing",
            "placement",
            "bookings",
            "chat",
            "assessment",
            "profile",
            "curriculum",
            "premium",
          ].includes(String(prefix[0]))
        );
      },
    };
    await queryClient.cancelQueries(filters);
    queryClient.removeQueries(filters);
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await clearPrivateData();
    await utils.auth.me.invalidate();
  }, [utils, clearPrivateData]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    await clearPrivateData();
    await utils.auth.me.invalidate();
  }, [logoutMutation, utils, clearPrivateData]);

  const value = useMemo<AuthValue>(
    () => ({
      user: (meQuery.data as SessionUser | null | undefined) ?? null,
      loading: meQuery.isLoading,
      refresh,
      logout,
    }),
    [meQuery.data, meQuery.isLoading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
