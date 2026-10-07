"use client";

import { DrinkImage } from "@/components/DrinkImage";
import { categoryEmoji, formatAlcohol } from "@/lib/format";

export type MenuDrink = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  alcoholPercentage: number | null;
  available: boolean;
};

type Props = {
  drink: MenuDrink;
  categoryName: string;
  cooldown: number;
  onOrder: (drink: MenuDrink) => void;
};

export function DrinkCard({ drink, categoryName, cooldown, onOrder }: Props) {
  const alcohol = formatAlcohol(drink.alcoholPercentage);
  const disabled = !drink.available || cooldown > 0;

  return (
    <article
      className={`flex animate-fade-up flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 ${
        drink.available ? "" : "opacity-60"
      }`}
    >
      <div className="relative">
        <DrinkImage
          src={drink.imageUrl}
          alt={drink.name}
          fallback={categoryEmoji(categoryName)}
          className={`aspect-square w-full ${drink.available ? "" : "grayscale"}`}
        />
        {!drink.available && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold">
            Rupture
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-bold leading-tight">{drink.name}</h3>
        {drink.description && (
          <p className="line-clamp-2 text-sm text-violet-200/70">
            {drink.description}
          </p>
        )}
        {alcohol && <p className="text-sm text-amber-300">{alcohol}</p>}
        <button
          disabled={disabled}
          onClick={() => onOrder(drink)}
          className="mt-auto rounded-2xl bg-amber-400 px-4 py-3 font-bold text-violet-950 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/50"
        >
          {!drink.available
            ? "Indisponible"
            : cooldown > 0
              ? `Patiente ${cooldown} s`
              : "Commander"}
        </button>
      </div>
    </article>
  );
}
