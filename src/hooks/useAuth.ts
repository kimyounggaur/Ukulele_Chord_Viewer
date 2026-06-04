import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type AuthRole = "member" | "admin";

export interface AuthUser {
  username: string;
  role: AuthRole;
}

export interface AuthResult {
  ok: boolean;
  message: string;
}

export type AuthAction = (email: string, password: string) => Promise<AuthResult>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getRole(user: User): AuthRole {
  return user.app_metadata.role === "admin" ? "admin" : "member";
}

function getUsername(user: User) {
  return user.user_metadata.display_name ?? user.email ?? "사용자";
}

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    username: getUsername(user),
    role: getRole(user),
  };
}

function requireSupabase(): NonNullable<typeof supabase> | null {
  return supabase;
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = requireSupabase();
    if (!client) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (mounted) {
        setCurrentUser(toAuthUser(data.session?.user ?? null));
        setLoading(false);
      }
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(toAuthUser(session?.user ?? null));
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback<AuthAction>(async (email, password) => {
    const client = requireSupabase();
    const normalizedEmail = normalizeEmail(email);

    if (!client) {
      return {
        ok: false,
        message: "Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 설정하세요.",
      };
    }

    if (!normalizedEmail || password.length < 6) {
      return { ok: false, message: "이메일과 6자 이상의 비밀번호를 입력하세요." };
    }

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          role: "member",
        },
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    setCurrentUser(toAuthUser(data.user));
    return { ok: true, message: "회원가입 완료. 이메일 확인이 필요할 수 있습니다." };
  }, []);

  const loginMember = useCallback<AuthAction>(async (email, password) => {
    const client = requireSupabase();

    if (!client) {
      return {
        ok: false,
        message: "Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 설정하세요.",
      };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    setCurrentUser(toAuthUser(data.user));
    return { ok: true, message: "회원 로그인 완료" };
  }, []);

  const loginAdmin = useCallback<AuthAction>(async (email, password) => {
    const client = requireSupabase();

    if (!client) {
      return {
        ok: false,
        message: "Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)를 설정하세요.",
      };
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    const user = toAuthUser(data.user);
    if (user?.role !== "admin") {
      await client.auth.signOut();
      setCurrentUser(null);
      return { ok: false, message: "관리자 권한이 없는 계정입니다." };
    }

    setCurrentUser(user);
    return { ok: true, message: "관리자 로그인 완료" };
  }, []);

  const logout = useCallback(async () => {
    const client = requireSupabase();
    if (client) {
      await client.auth.signOut();
    }
    setCurrentUser(null);
  }, []);

  return useMemo(
    () => ({
      currentUser,
      loading,
      canSearch: currentUser !== null,
      isAdmin: currentUser?.role === "admin",
      isSupabaseConfigured,
      signUp,
      loginMember,
      loginAdmin,
      logout,
    }),
    [currentUser, loading, loginAdmin, loginMember, logout, signUp],
  );
}
