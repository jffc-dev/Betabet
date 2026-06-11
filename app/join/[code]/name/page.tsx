import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "../../../lib/prisma";
import { joinWithNameAction } from "../../../lib/actions/invitations";
import { NameForm } from "../../../components/join/NameForm";

export const metadata: Metadata = { title: "Únete · BetaBet" };

export default async function JoinNamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: { code },
    include: { group: { select: { name: true } } },
  });

  if (!invitation) notFound();
  // Already used: resume through the route handler so the session cookie is set.
  if (invitation.redeemedByMemberId) redirect(`/join/${code}`);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-400">Invitación</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-100">
          Te uniste a {invitation.group.name}
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Escribe tu nombre para empezar. Guarda este enlace: es tu acceso para volver y
          seguir con tus predicciones.
        </p>
      </div>
      <NameForm action={joinWithNameAction.bind(null, code)} />
    </main>
  );
}
