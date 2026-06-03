import { useCallback, useMemo, useState } from "react";

export type AuthRole = "member" | "admin";

export interface AuthUser {
  username: string;
  role: AuthRole;
}

interface StoredMember {
  username: string;
  password: string;
}

export interface AuthResult {
  ok: boolean;
  message: string;
}

const CURRENT_USER_KEY = "ukulele-auth-current-user";
const MEMBERS_KEY = "ukulele-auth-members";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin1234";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    readJson<AuthUser | null>(CURRENT_USER_KEY, null),
  );
  const [members, setMembers] = useState<StoredMember[]>(() =>
    readJson<StoredMember[]>(MEMBERS_KEY, []),
  );

  const persistCurrentUser = useCallback((user: AuthUser | null) => {
    setCurrentUser(user);
    if (user) {
      writeJson(CURRENT_USER_KEY, user);
    } else {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, []);

  const signUp = useCallback(
    (username: string, password: string): AuthResult => {
      const normalizedUsername = normalizeUsername(username);

      if (normalizedUsername.length < 3 || password.length < 4) {
        return { ok: false, message: "아이디 3자 이상, 비밀번호 4자 이상으로 입력하세요." };
      }

      if (normalizedUsername === ADMIN_USERNAME) {
        return { ok: false, message: "admin은 관리자 전용 아이디입니다." };
      }

      if (members.some((member) => member.username === normalizedUsername)) {
        return { ok: false, message: "이미 가입된 회원 아이디입니다." };
      }

      const nextMembers = [...members, { username: normalizedUsername, password }];
      setMembers(nextMembers);
      writeJson(MEMBERS_KEY, nextMembers);
      persistCurrentUser({ username: normalizedUsername, role: "member" });

      return { ok: true, message: "회원가입 및 로그인 완료" };
    },
    [members, persistCurrentUser],
  );

  const loginMember = useCallback(
    (username: string, password: string): AuthResult => {
      const normalizedUsername = normalizeUsername(username);
      const member = members.find(
        (storedMember) =>
          storedMember.username === normalizedUsername && storedMember.password === password,
      );

      if (!member) {
        return { ok: false, message: "회원 아이디 또는 비밀번호가 맞지 않습니다." };
      }

      persistCurrentUser({ username: member.username, role: "member" });
      return { ok: true, message: "회원 로그인 완료" };
    },
    [members, persistCurrentUser],
  );

  const loginAdmin = useCallback(
    (username: string, password: string): AuthResult => {
      if (normalizeUsername(username) !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return { ok: false, message: "관리자 계정 정보가 맞지 않습니다." };
      }

      persistCurrentUser({ username: ADMIN_USERNAME, role: "admin" });
      return { ok: true, message: "관리자 로그인 완료" };
    },
    [persistCurrentUser],
  );

  const logout = useCallback(() => {
    persistCurrentUser(null);
  }, [persistCurrentUser]);

  return useMemo(
    () => ({
      currentUser,
      canSearch: currentUser !== null,
      isAdmin: currentUser?.role === "admin",
      signUp,
      loginMember,
      loginAdmin,
      logout,
    }),
    [currentUser, loginAdmin, loginMember, logout, signUp],
  );
}
