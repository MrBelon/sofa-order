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

function Header() {
  const { userName } = useUser();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f0a1f]/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-extrabold">
          🥂 {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={pathname === "/orders" ? "/" : "/orders"}
            className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold active:scale-95"
          >
            {pathname === "/orders" ? "Menu" : "Mes commandes"}
          </Link>
          <button
            onClick={() => setEditing(true)}
            aria-label="Modifier mon prénom"
            className="rounded-full bg-white/10 px-3 py-2 text-sm font-semibold active:scale-95"
          >
            {userName} ⚙
          </button>
        </div>
      </div>
      {editing && <EditNameModal onClose={() => setEditing(false)} />}
    </header>
  );
}

export function UserShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider gate={<NameGate />}>
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-5">{children}</main>
    </UserProvider>
  );
}
