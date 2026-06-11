// Shared shape returned by form server actions, consumed by `useActionState`.
export type ActionState = {
  ok: boolean;
  message?: string;
  // Keyed by form field name -> list of error messages.
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = { ok: false };
