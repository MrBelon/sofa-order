"use client";

import { DrinkImage } from "@/components/DrinkImage";
import type { AdminDrink } from "@/lib/admin-client";
import { categoryEmoji, formatAlcohol } from "@/lib/format";

type Props = {
  drink: AdminDrink;
  categoryName: string;
  busy: boolean;
  onToggle: (drink: AdminDrink) => void;
  onEdit: (drink: AdminDrink) => void;
  onDelete: (drink: AdminDrink) => void;
};

export function AdminDrinkCard({ drink, categoryName, busy, onToggle, onEdit, onDelete }: Props) {
  const alcohol = formatAlcohol(drink.alcoholPercentage);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <DrinkImage
          src={drink.imageUrl}
          alt=""
          fallback={categoryEmoji(categoryName)}
          className="h-14 w-14 shrink-0 rounded-xl text-2xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{drink.name}</p>
          <p className="truncate text-xs text-violet-300/70">
            {[alcohol, drink.barcode].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onToggle(drink)}
          disabled={busy}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-bold active:scale-95 disabled:opacity-50 sm:flex-none ${
            drink.available
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {drink.available ? "✓ En stock" : "✕ Rupture"}
        </button>
        <button
          onClick={() => onEdit(drink)}
          aria-label={`Modifier ${drink.name}`}
          className="rounded-full bg-white/10 px-3 py-2 text-sm"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(drink)}
          aria-label={`Supprimer ${drink.name}`}
          className="rounded-full bg-white/10 px-3 py-2 text-sm"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}