import { createFileRoute, notFound } from "@tanstack/react-router";
import { ObsidianMarkdown } from "../obsidian/ObsidianMarkdown.tsx";
import { getObsidianNote } from "../obsidian/notes.ts";

export const Route = createFileRoute("/$slug")({
  component: NotePage,
  loader: ({ params }) => {
    const note = getObsidianNote(params.slug);

    if (!note) {
      throw notFound();
    }

    return note;
  },
});

// eslint-disable-next-line react-refresh/only-export-components
function NotePage() {
  const note = Route.useLoaderData();

  return <ObsidianMarkdown content={note.content} />;
}
