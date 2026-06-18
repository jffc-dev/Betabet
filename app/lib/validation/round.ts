import { z } from "zod";

// Validation for editing a round. Field names match the form inputs so we can
// build it straight from FormData.
export const roundInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "El título debe tener al menos 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  scoringMode: z.enum(["FLAT", "UNIQUE_BONUS"], {
    message: "Modo de puntuación inválido",
  }),
});

export type RoundInput = z.infer<typeof roundInputSchema>;
