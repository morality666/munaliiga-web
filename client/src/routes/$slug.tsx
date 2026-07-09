import { createFileRoute, notFound } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ObsidianMarkdown } from "../obsidian/ObsidianMarkdown.tsx";
import { getObsidianNote, hasObsidianNote } from "../obsidian/notes.ts";

export const Route = createFileRoute("/$slug")({
  component: NotePage,
  loader: ({ params }) => {
    if (!hasObsidianNote(params.slug)) {
      throw notFound();
    }
  },
});

// eslint-disable-next-line react-refresh/only-export-components
function NotePage() {
  const { i18n } = useTranslation();
  const { slug } = Route.useParams();
  const note = getObsidianNote(slug, i18n.resolvedLanguage ?? i18n.language);

  return note ? (
    <ObsidianMarkdown content={note.content} />
  ) : null;
}
