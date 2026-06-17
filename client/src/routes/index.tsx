import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ObsidianMarkdown } from "../obsidian/ObsidianMarkdown.tsx";
import { getObsidianNote } from "../obsidian/notes.ts";

export const Route = createFileRoute("/")({
  component: MainView,
});

// eslint-disable-next-line react-refresh/only-export-components
function MainView() {
  const { i18n } = useTranslation();
  const note = getObsidianNote("", i18n.resolvedLanguage ?? i18n.language);

  return note ? (
    <ObsidianMarkdown key={note.path} content={note.content} />
  ) : null;
}
