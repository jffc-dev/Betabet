import { z } from "zod";

export const joinNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Escribe tu nombre (mínimo 2 caracteres)")
    .max(40, "Máximo 40 caracteres"),
});

export const outcomeSchema = z.enum(["HOME", "DRAW", "AWAY"]);

export const predictionPicksSchema = z.array(
  z.object({
    roundMatchId: z.string().min(1),
    outcome: outcomeSchema,
  }),
);

export type PredictionPick = z.infer<typeof predictionPicksSchema>[number];
