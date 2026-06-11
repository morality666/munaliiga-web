const markdownFiles = import.meta.glob<string>("../../notes/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const imageFiles = import.meta.glob<string>(
  "../../notes/**/*.{avif,gif,jpeg,jpg,png,svg,webp}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

export type ObsidianNote = {
  content: string;
  path: string;
  slug: string;
  title: string;
};

const normalize = (path: string) => path.replace(/\\/g, "/");

const fileName = (path: string) =>
  normalize(path).split("/").at(-1)?.replace(/\.[^.]+$/, "") ?? "note";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleFor = (content: string, path: string) =>
  content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fileName(path);

export const obsidianNotes = Object.entries(markdownFiles)
  .map(([path, content]) => ({
    content,
    path,
    slug: slugify(fileName(path)),
    title: titleFor(content, path),
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

export const getObsidianNote = (slug: string) =>
  obsidianNotes.find((note) => note.slug === slug);

export const getObsidianAssetUrl = (reference: string) => {
  const cleanReference = normalize(reference).trim();

  if (/^(\/|#|data:|https?:\/\/)/.test(cleanReference)) {
    return cleanReference;
  }

  // Just add images to notes/attachments folder and reference them like ![[image.png]]
  const image = Object.entries(imageFiles).find(([path]) =>
    normalize(path).endsWith(`/attachments/${cleanReference}`),
  );

  return image?.[1] ?? cleanReference;
};
