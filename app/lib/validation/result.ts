import { z } from "zod";

// A single team's final score.
export const scoreSchema = z.coerce
  .number({ message: "Marcador inválido" })
  .int("Debe ser un número entero")
  .min(0, "No puede ser negativo")
  .max(99, "Máximo 99");
