"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SUCCESS_MESSAGES } from "@/lib/constants";

export function OrderSuccess({ drink }: { drink: string }) {
  // Picked after mount to avoid a server/client hydration mismatch.
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
  }, []);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 text-center">
      <div className="animate-float text-8xl">🍺</div>
      <h1 className="text-4xl font-extrabold">C&apos;est parti !</h1>
      {drink && (
        <p className="text-xl text-violet-100">
          <strong className="text-amber-300">{drink}</strong>
          <br />
          est en route vers toi.
          <br />
          <span className="text-violet-300/70">Normalement.</span>
        </p>
      )}
      <p className="min-h-14 max-w-xs animate-pop text-lg text-violet-100" key={message}>
        {message}
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-amber-400 px-5 py-4 text-lg font-bold text-violet-950 active:scale-95"
        >
          Retour à la carte
        </Link>
        <Link
          href="/orders"
          className="rounded-2xl bg-white/10 px-5 py-3 font-semibold active:scale-95"
        >
          Mes commandes
        </Link>
      </div>
    </div>
  );
}
