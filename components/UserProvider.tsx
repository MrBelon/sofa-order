"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { USER_ID_KEY, USER_NAME_KEY } from "@/lib/constants";
import { generateUuid } from "@/lib/format";

type UserState = {
  userId: string;
  userName: string;
  setUserName: (name: string) => void;
};

const UserContext = createContext<UserState | null>(null);

export function useUser(): UserState {
  const value = useContext(UserContext);
  if (!value) throw new Error("useUser must be used inside <UserProvider>");
  return value;
}

type Props = {
  children: React.ReactNode;
  // Rendered while no name is stored yet.
  gate: React.ReactNode;
};

export function UserProvider({ children, gate }: Props) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setName] = useState("");

  useEffect(() => {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = generateUuid();
      localStorage.setItem(USER_ID_KEY, id);
    }
    setUserId(id);
    setName(localStorage.getItem(USER_NAME_KEY) ?? "");
    setReady(true);
  }, []);

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 40);
    if (!trimmed) return;
    localStorage.setItem(USER_NAME_KEY, trimmed);
    setName(trimmed);
  }, []);

  const value = useMemo(
    () => ({ userId, userName, setUserName }),
    [userId, userName, setUserName],
  );

  if (!ready) return null;
  if (!userName) {
    return <UserContext.Provider value={value}>{gate}</UserContext.Provider>;
  }
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
