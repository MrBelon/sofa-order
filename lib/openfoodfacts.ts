const OFF_BASE_URL = "https://fr.openfoodfacts.org/api/v2/product";
const OFF_FIELDS = [
  "code",
  "product_name",
  "product_name_fr",
  "generic_name",
  "generic_name_fr",
  "brands",
  "quantity",
  "image_front_url",
  "image_url",
  "categories_tags",
  "nutriments",
].join(",");

export type OpenFoodFactsProduct = {
  barcode: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  alcoholPercentage: number | null;
  suggestedCategory: string | null;
};

type RawProduct = {
  product_name?: string;
  product_name_fr?: string;
  generic_name?: string;
  generic_name_fr?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  image_url?: string;
  categories_tags?: string[];
  nutriments?: Record<string, unknown>;
};

// Ordered: the first matching rule wins. Names match the default categories.
const CATEGORY_RULES: [RegExp, string][] = [
  [/(^|:)(beers?|bieres?)$/, "Bières"],
  [/(^|:)(wines?|vins?)$/, "Vins"],
  [/(^|:)(cocktails?)$/, "Cocktails"],
  [/(^|:)(spirits|liqueurs?|whiskys?|whiskeys?|vodkas?|rums?|gins?|tequilas?|brandies|aperitifs?)$/, "Alcools"],
  [/(^|:)(non-alcoholic-beverages?|alcohol-free.*)$/, "Sans alcool"],
  [/(^|:)(sodas?|carbonated-drinks|colas?|waters?|juices?|fruit-juices|iced-teas?|sweetened-beverages|beverages)$/, "Softs"],
];

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function guessCategory(tags: string[] | undefined): string | null {
  if (!tags) return null;
  for (const [pattern, category] of CATEGORY_RULES) {
    if (tags.some((tag) => pattern.test(tag.toLowerCase()))) return category;
  }
  return null;
}

function readAlcohol(nutriments: Record<string, unknown> | undefined) {
  const raw = nutriments?.alcohol_100g ?? nutriments?.alcohol;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 && value <= 100 ? value : null;
}

function safeHttpUrl(value: unknown): string | null {
  const url = clean(value);
  if (!url) return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export type LookupResult =
  | { status: "found"; product: OpenFoodFactsProduct }
  | { status: "not_found" }
  | { status: "error" };

export async function lookupBarcode(barcode: string): Promise<LookupResult> {
  try {
    const response = await fetch(
      `${OFF_BASE_URL}/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`,
      {
        headers: {
          "User-Agent": "DrinkOrder/1.0 (private party app)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      },
    );

    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "error" };

    const data = (await response.json()) as {
      status?: number;
      product?: RawProduct;
    };
    const product = data.product;
    if (data.status === 0 || !product) return { status: "not_found" };

    const baseName = clean(product.product_name_fr) ?? clean(product.product_name);
    if (!baseName) return { status: "not_found" };

    const brand = clean(product.brands?.split(",")[0]);
    const name =
      brand && !baseName.toLowerCase().includes(brand.toLowerCase())
        ? `${brand} ${baseName}`
        : baseName;

    return {
      status: "found",
      product: {
        barcode,
        name: name.slice(0, 100),
        description: (
          clean(product.generic_name_fr) ??
          clean(product.generic_name) ??
          clean(product.quantity)
        )?.slice(0, 500) ?? null,
        imageUrl: safeHttpUrl(product.image_front_url) ?? safeHttpUrl(product.image_url),
        alcoholPercentage: readAlcohol(product.nutriments),
        suggestedCategory: guessCategory(product.categories_tags),
      },
    };
  } catch {
    return { status: "error" };
  }
}
