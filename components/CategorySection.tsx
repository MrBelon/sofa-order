"use client";

import { DrinkCard, type MenuDrink } from "@/components/DrinkCard";
import { categoryEmoji } from "@/lib/format";

export type MenuCategory = {
  id: string;
  name: string;
  drinks: MenuDrink[];
};

type Props = {
  category: MenuCategory;
  cooldown: number;
  onOrder: (drink: MenuDrink) => void;
};

export function CategorySection({ category, cooldown, onOrder }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold">
        {categoryEmoji(category.name)} {category.name}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {category.drinks.map((drink) => (
          <DrinkCard
            key={drink.id}
            drink={drink}
            categoryName={category.name}
            cooldown={cooldown}
            onOrder={onOrder}
          />
        ))}
      </div>
    </section>
  );
}
