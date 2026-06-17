const markdownFiles = import.meta.glob<string>(
  ["../../notes/en/**/*.md", "../../notes/fi/**/*.md"],
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
);

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
  language: "en" | "fi";
  order: number;
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

const slugFor = (path: string) => {
  const name = fileName(path);

  return name === "index" ? "" : slugify(name);
};

const titleFor = (content: string, path: string) =>
  content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fileName(path);

const orderFor = (content: string) => {
  const order = content.match(/^order:\s*(\d+)$/m)?.[1];

  return order ? Number(order) : 999;
};

const languageFor = (path: string) => {
  const language = normalize(path)
    .split("/")
    .find((part) => part === "en" || part === "fi");

  return language ?? "en";
};

export const obsidianNotes = Object.entries(markdownFiles)
  .map(([path, content]) => ({
    content,
    language: languageFor(path),
    order: orderFor(content),
    path,
    slug: slugFor(path),
    title: titleFor(content, path),
  }))
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

const cleanLanguage = (language: string) =>
  language.toLowerCase().startsWith("fi") ? "fi" : "en";

export const hasObsidianNote = (slug: string) =>
  obsidianNotes.some((note) => note.slug === slug);

export const getObsidianNote = (slug: string, language: string) => {
  const pageLanguage = cleanLanguage(language);
  const localizedNote = obsidianNotes.find(
    (note) => note.slug === slug && note.language === pageLanguage,
  );
  const englishNote = obsidianNotes.find(
    (note) => note.slug === slug && note.language === "en",
  );

  return localizedNote ?? englishNote ?? obsidianNotes.find((note) => note.slug === slug);
};

export const getObsidianNotes = (language: string) => {
  const slugs = [...new Set(obsidianNotes.map((note) => note.slug))];

  return slugs
    .map((slug) => getObsidianNote(slug, language))
    .filter((note) => note !== undefined)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
};

export const getObsidianAssetUrl = (reference: string) => {
  const cleanReference = normalize(reference).trim();

  if (/^(\/|#|data:|https?:\/\/)/.test(cleanReference)) {
    return cleanReference;
  }

  const image = Object.entries(imageFiles).find(([path]) =>
    normalize(path).endsWith(`/attachments/${cleanReference}`),
  );

  return image?.[1] ?? cleanReference;
};
