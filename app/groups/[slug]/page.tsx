import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Check, Pencil, Ticket, Trophy } from "lucide-react";
import { getGroupBySlug } from "../../lib/data/groups";
import { listTemplatesForGroup } from "../../lib/data/templates";
import { deleteGroupAction } from "../../lib/actions/groups";
import { createInvitationAction, deleteInvitationAction } from "../../lib/actions/invitations";
import { applyTemplateAction } from "../../lib/actions/templates";
import { DeleteGroupButton } from "../../components/groups/DeleteGroupButton";
import { CopyLinkButton } from "../../components/groups/CopyLinkButton";
import { ApplyTemplateForm } from "../../components/groups/ApplyTemplateForm";
import { BackLink } from "../../components/BackLink";
import { Button } from "../../components/ui/button";

const ROLE_LABEL: Record<string, string> = { OWNER: "Dueño", ADMIN: "Admin", MEMBER: "Miembro" };
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  OPEN: "Abierta",
  LOCKED: "Cerrada",
  SETTLED: "Resuelta",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  return { title: group ? `${group.name} · BetaBet` : "Grupo · BetaBet" };
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  const templates = await listTemplatesForGroup(group.id);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <BackLink href="/groups" label="Grupos" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-100">
            {group.name}
          </h1>
          {group.description ? (
            <p className="mt-1 text-sm text-neutral-400">{group.description}</p>
          ) : null}
        </div>
        <Button asChild variant="outline" size="icon" aria-label="Editar grupo">
          <Link href={`/groups/${group.slug}/edit`}>
            <Pencil className="size-4" />
          </Link>
        </Button>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="Miembros" value={group._count.members} />
        <Stat label="Rondas" value={group._count.rounds} />
        <Stat label="Pts/partido" value={group.defaultMatchPoints} />
      </dl>

      <Section title="Miembros">
        {group.members.length === 0 ? (
          <Muted>Aún no hay miembros. Crea una invitación para añadir gente.</Muted>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <li
                key={member.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm text-neutral-200"
              >
                {member.name}
                <span className="text-[10px] uppercase tracking-wide text-neutral-500">
                  {ROLE_LABEL[member.role]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Rondas">
        {group.rounds.length === 0 ? (
          <Muted>Aún no hay rondas en este grupo.</Muted>
        ) : (
          <ul className="flex flex-col gap-2">
            {group.rounds.map((round) => (
              <li key={round.id}>
                <Link
                  href={`/groups/${group.slug}/rounds/${round.id}`}
                  className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 transition-colors hover:border-neutral-700 active:bg-neutral-800/60"
                >
                  <span className="truncate text-sm text-neutral-100">{round.title}</span>
                  <span className="ml-3 shrink-0 text-xs text-neutral-400">
                    {STATUS_LABEL[round.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Plantillas">
        <p className="mb-3 text-sm text-neutral-500">
          Usa una competición ya armada para crear sus rondas y partidos al instante.
        </p>
        {templates.length === 0 ? (
          <Muted>No hay plantillas disponibles.</Muted>
        ) : (
          <ul className="flex flex-col gap-2">
            {templates.map((template) => (
              <li
                key={template.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm text-neutral-200">
                      <Trophy className="size-3.5 shrink-0 text-neutral-500" />
                      <span className="truncate">{template.name}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {template._count.matches} partidos
                    </p>
                  </div>
                  {template.applied ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-400">
                      <Check className="size-3.5" />
                      Aplicada
                    </span>
                  ) : null}
                </div>
                {template.applied ? null : (
                  <ApplyTemplateForm
                    action={applyTemplateAction.bind(null, {
                      templateId: template.id,
                      groupId: group.id,
                      slug: group.slug,
                    })}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Invitaciones">
        <p className="mb-3 text-sm text-neutral-500">
          Cada enlace sirve para que una persona entre y guarde su nombre y predicciones.
        </p>
        {group.invitations.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2">
            {group.invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm text-neutral-200">
                    <Ticket className="size-3.5 shrink-0 text-neutral-500" />
                    <span className="truncate font-mono text-xs">/join/{invitation.code}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {invitation.redeemedByMember
                      ? `Usada por ${invitation.redeemedByMember.name}`
                      : "Disponible"}
                  </p>
                </div>
                {invitation.redeemedByMember ? (
                  <CopyLinkButton path={`/join/${invitation.code}`} />
                ) : (
                  <div className="flex shrink-0 gap-1.5">
                    <CopyLinkButton path={`/join/${invitation.code}`} />
                    <form action={deleteInvitationAction.bind(null, { id: invitation.id, slug: group.slug })}>
                      <Button type="submit" variant="ghost" size="sm">
                        Revocar
                      </Button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Muted>Aún no has generado invitaciones.</Muted>
        )}
        <form action={createInvitationAction.bind(null, { groupId: group.id, slug: group.slug })}>
          <Button type="submit" variant="outline" className="mt-2 w-full">
            <Ticket className="size-4" />
            Generar invitación
          </Button>
        </form>
      </Section>

      <div className="mt-8 border-t border-neutral-800 pt-6">
        <DeleteGroupButton action={deleteGroupAction.bind(null, group.id)} />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-3 py-3 text-center">
      <dd className="text-xl font-bold text-emerald-400">{value}</dd>
      <dt className="mt-0.5 text-[11px] text-neutral-500">{label}</dt>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-neutral-500">{children}</p>;
}
