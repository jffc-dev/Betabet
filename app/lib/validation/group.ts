import { z } from "zod";

// Shared validation for creating/editing a group. Field names match the form
// inputs so we can build it straight from FormData.
export const groupInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "Máximo 60 caracteres"),
  description: z
    .string()
    .trim()
    .max(280, "Máximo 280 caracteres")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  defaultMatchPoints: z.coerce
    .number({ message: "Debe ser un número" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 punto")
    .max(100, "Máximo 100 puntos"),
  defaultScoringMode: z.enum(["FLAT", "UNIQUE_BONUS"], {
    message: "Modo de puntuación inválido",
  }),
  defaultUniqueHitPoints: z.coerce
    .number({ message: "Debe ser un número" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 punto")
    .max(100, "Máximo 100 puntos"),
});

export type GroupInput = z.infer<typeof groupInputSchema>;
