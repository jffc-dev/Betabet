"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "../prisma";
import { groupInputSchema } from "../validation/group";
import { uniqueSlug } from "../slug";
import type { ActionState } from "./types";

// NOTE(auth): Server Actions are public POST endpoints. Once a sign-in flow
// exists, gate these with `auth()` and verify the caller may manage the group.

function parseGroupForm(formData: FormData) {
  return groupInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    defaultMatchPoints: formData.get("defaultMatchPoints"),
  });
}

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

const invalid = (error: z.ZodError): ActionState => ({
  ok: false,
  message: "Revisa los campos marcados.",
  fieldErrors: toFieldErrors(error),
});

export async function createGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseGroupForm(formData);
  if (!parsed.success) return invalid(parsed.error);
  const { name, description, defaultMatchPoints } = parsed.data;

  const slug = await uniqueSlug(
    name,
    async (s) => (await prisma.group.count({ where: { slug: s } })) > 0,
  );

  await prisma.group.create({
    data: { name, slug, description: description ?? null, defaultMatchPoints },
  });

  revalidatePath("/groups");
  redirect(`/groups/${slug}`);
}

export async function updateGroupAction(
  ref: { id: string; slug: string },
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseGroupForm(formData);
  if (!parsed.success) return invalid(parsed.error);
  const { name, description, defaultMatchPoints } = parsed.data;

  await prisma.group.update({
    where: { id: ref.id },
    // slug is intentionally immutable so URLs stay stable.
    data: { name, description: description ?? null, defaultMatchPoints },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${ref.slug}`);
  redirect(`/groups/${ref.slug}`);
}

export async function deleteGroupAction(id: string): Promise<void> {
  await prisma.group.delete({ where: { id } });
  revalidatePath("/groups");
  redirect("/groups");
}
