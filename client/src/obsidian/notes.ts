const markdownFiles = import.meta.glob<string>(
  ["../../notes/en/**/*.md", "../../notes/fi/**/*.md"],
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
);

const htmlFiles = import.meta.glob<string>(
  ["../../notes/en/**/*.html", "../../notes/fi/**/*.html"],
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

export type ObsidianNoteFormat = "html" | "markdown";

export type ObsidianNote = {
  category: string | null;
  content: string;
  format: ObsidianNoteFormat;
  isIndex: boolean;
  language: "en" | "fi";
  order: number;
  path: string;
  section: string | null;
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

const stripHtml = (value: string) =>
  value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");

const directoriesFor = (path: string) => {
  const parts = normalize(path).split("/");
  const languageIndex = parts.findIndex(
    (part) => part === "en" || part === "fi",
  );

  return parts.slice(languageIndex + 1, -1).map(slugify).filter(Boolean);
};

const slugFor = (path: string) => {
  const name = fileName(path);
  const directories = directoriesFor(path);

  if (name === "index") {
    return directories.join("-");
  }

  return [...directories, slugify(name)].join("-");
};

const htmlTitleFor = (content: string) => {
  const heading = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = content.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const rawTitle = heading ?? title;

  return rawTitle ? decodeHtml(stripHtml(rawTitle)) : undefined;
};

const titleFor = (content: string, path: string, format: ObsidianNoteFormat) =>
  format === "html"
    ? htmlTitleFor(content) ?? fileName(path)
    : content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fileName(path);

const orderFor = (content: string) => {
  const order =
    content.match(/^order:\s*(\d+)$/m)?.[1] ??
    content.match(/<meta\s+name=["']order["']\s+content=["'](\d+)["']\s*\/?>/i)?.[1];

  return order ? Number(order) : 999;
};

const languageFor = (path: string) => {
  const language = normalize(path)
    .split("/")
    .find((part) => part === "en" || part === "fi");

  return language ?? "en";
};

const noteFiles: Array<[string, string, ObsidianNoteFormat]> = [
  ...Object.entries(markdownFiles).map(
    ([path, content]): [string, string, ObsidianNoteFormat] => [
      path,
      content,
      "markdown",
    ],
  ),
  ...Object.entries(htmlFiles).map(
    ([path, content]): [string, string, ObsidianNoteFormat] => [
      path,
      content,
      "html",
    ],
  ),
];

export const obsidianNotes = noteFiles
  .map(([path, content, format]) => {
    const directories = directoriesFor(path);

    return {
      category: directories[1] ?? null,
      content,
      format,
      isIndex: fileName(path) === "index",
      language: languageFor(path),
      order: orderFor(content),
      path,
      section: directories[0] ?? null,
      slug: slugFor(path),
      title: titleFor(content, path, format),
    };
  })
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
