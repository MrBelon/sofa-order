import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    try {
      const { protocol } = new URL(value);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "URL invalide");

// Optional text field: empty string / null / undefined all become null.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const optionalUrl = httpUrl
  .or(z.literal(""))
  .nullish()
  .transform((value) => (value ? value : null));

export const barcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{8,14}$/, "Code-barres invalide (8 à 14 chiffres)");

const optionalBarcode = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null))
  .pipe(barcodeSchema.nullable());

const optionalAlcohol = z
  .number()
  .min(0)
  .max(100)
  .nullish()
  .transform((value) => value ?? null);

export const userNameSchema = z.string().trim().min(1).max(40);

export const orderSchema = z.object({
  userId: z.uuid(),
  userName: userNameSchema,
  drinkId: z.uuid(),
});

export const userIdQuerySchema = z.uuid();

export const drinkSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: optionalText(500),
  imageUrl: optionalUrl,
  categoryId: z.uuid(),
  alcoholPercentage: optionalAlcohol,
  barcode: optionalBarcode,
  source: z.enum(["MANUAL", "OPEN_FOOD_FACTS"]).default("MANUAL"),
  available: z.boolean().default(true),
});

export const drinkPatchSchema = drinkSchema.partial().extend({
  // Parsing a partial schema must not re-apply defaults to omitted fields.
  source: z.enum(["MANUAL", "OPEN_FOOD_FACTS"]).optional(),
  available: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export const openFoodFactsSchema = z.object({
  barcode: barcodeSchema,
});

export const loginSchema = z.object({
  password: z.string().min(1).max(200),
});
