"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { NameGate } from "@/components/NameGate";
import { UserProvider, useUser } from "@/components/UserProvider";
import { APP_NAME } from "@/lib/constants";

function EditNameModal({ onClose }: { onClose: () => void }) {
  const { userName, setUserName } = useUser();
  const [name, setName] = useState(userName);

  return (
    <Modal onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setUserName(name);
          onClose();
        }}
      >
        <h2 className="text-xl font-bold">Ton prénom</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          autoFocus
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-lg outline-none focus:border-amber-300"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-white/10 px-4 py-3 font-semibold active:scale-95"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 rounded-2xl bg-amber-400 px-4 py-3 font-bold text-violet-950 active:scale-95 disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

const NAV = [
  { href: "/", label: "Carte", icon: "🍹" },
  { href: "/orders", label: "Mes commandes", icon: "🧾" },
];

function Header() {
  const { userName } = useUser();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f0a1f]/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="min-w-0 truncate text-lg font-extrabold">
          🥂 {APP_NAME}
        </Link>
        <nav className="ml-auto hidden gap-2 sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold active:scale-95 ${
                pathname === item.href ? "bg-amber-400 text-violet-950" : "bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => setEditing(true)}
          aria-label="Modifier mon prénom"
          className="flex min-w-0 max-w-[45%] shrink-0 items-center gap-1.5 rounded-full bg-white/10 py-2 pl-3 pr-3 text-sm font-semibold active:scale-95"
        >
          <span className="truncate">{userName}</span>
          <span aria-hidden>✏️</span>
        </button>
      </div>
      {editing && <EditNameModal onClose={() => setEditing(false)} />}
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0f0a1f]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 p-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold active:scale-95 ${
              pathname === item.href ? "bg-amber-400 text-violet-950" : "bg-white/10"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function UserShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider gate={<NameGate />}>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5 sm:pb-16">{children}</main>
      <BottomNav />
    </UserProvider>
  );
}