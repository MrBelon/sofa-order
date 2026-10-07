export type AdminCategory = {
  id: string;
  name: string;
  drinkCount: number;
};

export type AdminDrink = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  barcode: string | null;
  alcoholPercentage: number | null;
  available: boolean;
  categoryId: string;
  source: "MANUAL" | "OPEN_FOOD_FACTS";
};

export type DrinkDraft = {
  name: string;
  description: string;
  imageUrl: string;
  barcode: string;
  alcohol: string;
  categoryId: string;
  available: boolean;
  source: "MANUAL" | "OPEN_FOOD_FACTS";
};

export type OffProduct = {
  barcode: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  alcoholPercentage: number | null;
  suggestedCategory: string | null;
};

export type AdminStats = {
  totalOrders: number;
  totalUsers: number;
  topDrinks: { name: string; count: number }[];
  topUsers: { name: string; count: number }[];
};

export type AdminOrder = {
  id: string;
  userName: string;
  drinkName: string;
  webhookStatus: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
};

export class UnauthorizedError extends Error {}

// Small fetch wrapper for admin endpoints; throws readable errors.
export async function adminFetch<T = unknown>(
  url: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (response.status === 401) throw new UnauthorizedError("Session expirée");
  if (!response.ok) {
    const error = new Error(data.error ?? "Une erreur est survenue") as Error & {
      status: number;
    };
    error.status = response.status;
    throw error;
  }
  return data as T;
}
