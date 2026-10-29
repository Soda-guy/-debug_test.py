import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    displayName: z.string().min(2, "Name must be at least 2 characters").max(60),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const contributionSchema = z.object({
  billId: z.string().min(1),
  amountMinor: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
});

export const billSubmitSchema = z.object({
  category: z.enum([
    "electric",
    "water",
    "gas",
    "rent",
    "mortgage",
    "auto_insurance",
    "car_payment",
    "internet",
    "phone",
    "medical",
    "student_loan",
    "credit_card",
    "other",
  ]),
  countryCode: z.string().length(2),
  region: z.string().optional(),
  currencyCode: z.string().length(3),
  amountMajor: z.number().positive("Amount must be positive"),
  dueDate: z.string().min(1, "Due date required"),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  billerName: z.string().min(2).max(80),
  statementTitle: z.string().min(2).max(100),
  fileName: z.string().optional(),
  fileType: z
    .string()
    .optional()
    .refine(
      (t) => !t || ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(t),
      "Supported formats: PDF, JPG, PNG, WEBP"
    ),
});

export const profileSchema = z.object({
  displayName: z.string().min(2).max(60),
  preferredCurrency: z.string().length(3),
  locale: z.string().min(2),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BillSubmitInput = z.infer<typeof billSubmitSchema>;
