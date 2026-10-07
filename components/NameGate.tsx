"use client";

import { useState } from "react";
import { APP_NAME } from "@/lib/constants";
import { useUser } from "@/components/UserProvider";

export function NameGate() {
  const { setUserName } = useUser();
  const [name, setName] = useState("");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="animate-float text-7xl">🥂</div>
      <div>
        <h1 className="text-3xl font-extrabold">Bienvenue !</h1>
        <p className="mt-1 text-violet-200/80">{APP_NAME}</p>
      </div>
      <form
        className="flex w-full flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setUserName(name);
        }}
      >
        <label htmlFor="name" className="text-lg text-violet-100">
          Avant de commencer...
          <br />
          Comment tu t&apos;appelles ?
        </label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          autoFocus
          autoComplete="given-name"
          placeholder="Joli prénom"
          className="w-full rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center text-xl outline-none placeholder:text-white/30 focus:border-amber-300"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-2xl bg-amber-400 px-5 py-4 text-lg font-bold text-violet-950 transition active:scale-95 disabled:opacity-40"
        >
          Continuer
        </button>
      </form>
    </main>
  );
}
