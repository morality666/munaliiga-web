import clsx from "clsx";
import { Info, Lightbulb, NotebookText, TriangleAlert } from "lucide-react";
import React from "react";
import { getObsidianAssetUrl } from "./notes.ts";

type ObsidianMarkdownProps = {
  content: string;
};

// If anyone wants to add more callout types, just add them to these records and add an icon in calloutIcons
// These should be similar enough to the ones Obsidian uses for consistency, but feel free to customize
// Regular unicode emojis work fine too

const calloutNames: Record<string, string> = {
  info: "Info",
  note: "Note",
  tip: "Tip",
  warning: "Warning",
};

const calloutStyles: Record<string, string> = {
  info: "border-sky-500 bg-sky-500/10 text-sky-950 dark:text-sky-100",
  note: "border-blue-500 bg-blue-500/10 text-blue-950 dark:text-blue-100",
  tip: "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  warning: "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-100",
};

const calloutIcons = {
  info: Info,
  note: NotebookText,
  tip: Lightbulb,
  warning: TriangleAlert,
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const image = (src: string, alt: string, key: React.Key, size = "") => {
  const [width, height] = size.split("x");

  return (
    <img
      key={key}
      className="my-4 max-h-[32rem] w-auto max-w-full rounded-sm object-contain"
      src={getObsidianAssetUrl(src)}
      alt={alt}
      width={width || undefined}
      height={height || undefined}
      loading="lazy"
    />
  );
};

const inline = (text: string): React.ReactNode[] => {
  const parts = text.split(
    /(!\[\[[^\]]+]]|!\[[^\]]*]\([^)]+\)|\[\[[^\]]+]]|\[[^\]]+]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g,
  );

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("![[") && part.endsWith("]]")) {
      const [src = "", size = ""] = part.slice(3, -2).split("|");
      return image(src, src, index, size);
    }

    if (part.startsWith("![")) {
      const match = part.match(/^!\[([^\]]*)]\(([^)]+)\)$/);
      return image(match?.[2] ?? "", match?.[1] ?? "", index);
    }

    if (part.startsWith("[[")) {
      const [target = "", label = target] = part.slice(2, -2).split("|");

      return (
        <a
          key={index}
          className="font-semibold text-interactive underline underline-offset-4 hover:text-hovered dark:text-interactive-dark dark:hover:text-hovered-dark"
          href={`/${slugify(target)}`}
        >
          {label}
        </a>
      );
    }

    if (part.startsWith("[")) {
      const match = part.match(/^\[([^\]]+)]\(([^)]+)\)$/);

      return (
        <a
          key={index}
          className="font-semibold text-interactive underline underline-offset-4 hover:text-hovered dark:text-interactive-dark dark:hover:text-hovered-dark"
          href={match?.[2] ?? ""}
        >
          {match?.[1] ?? part}
        </a>
      );
    }

    if (part.startsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-sm bg-midground px-1.5 py-0.5 text-sm dark:bg-midground-dark"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
};

const paragraph = (lines: string[], key: React.Key) => (
  <p key={key} className="leading-7 text-bodytext dark:text-bodytext-dark">
    {inline(lines.join(" "))}
  </p>
);

const list = (lines: string[], key: React.Key) => {
  const ordered = /^\s*\d+[.)]\s+/.test(lines[0] ?? "");
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag
      key={key}
      className={clsx(
        "space-y-2 pl-6 leading-7 text-bodytext dark:text-bodytext-dark",
        ordered ? "list-decimal" : "list-disc",
      )}
    >
      {lines.map((line, index) => (
        <li key={index}>{inline(line.replace(/^\s*[-*+]\s+|^\s*\d+[.)]\s+/, ""))}</li>
      ))}
    </Tag>
  );
};

const callout = (lines: string[], key: React.Key) => {
  const match = lines[0]?.match(/^>\s*\[!(\w+)]\s*(.*)$/);
  const kind = match?.[1]?.toLowerCase() ?? "note";
  const title = match?.[2] || calloutNames[kind] || kind;
  const body = lines.slice(1).map((line) => line.replace(/^>\s?/, ""));
  const Icon = calloutIcons[kind as keyof typeof calloutIcons] ?? NotebookText;

  return (
    <aside
      key={key}
      className={clsx(
        "border-l-4 px-4 py-3",
        calloutStyles[kind] ?? "border-accent bg-midground text-bodytext dark:bg-midground-dark dark:text-bodytext-dark",
      )}
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase">
        <Icon aria-hidden className="h-4 w-4" />
        {title}
      </p>
      <MarkdownLines lines={body} />
    </aside>
  );
};

const blockquote = (lines: string[], key: React.Key) => (
  <blockquote
    key={key}
    className="border-l-4 border-hovered pl-4 italic text-bodytext dark:border-hovered-dark dark:text-bodytext-dark"
  >
    <MarkdownLines lines={lines.map((line) => line.replace(/^>\s?/, ""))} />
  </blockquote>
);

const isListLine = (line: string) => /^\s*[-*+]\s+|^\s*\d+[.)]\s+/.test(line);
const isCalloutLine = (line: string) => /^>\s*\[!\w+]/.test(line);
const isBlockquoteLine = (line: string) => /^>/.test(line);
const isHeadingLine = (line: string) => /^#{1,6}\s+/.test(line);
const isRuleLine = (line: string) => /^---+$/.test(line.trim());
const startsNewBlock = (line: string) =>
  !line.trim() ||
  line.startsWith("```") ||
  isHeadingLine(line) ||
  isRuleLine(line) ||
  isCalloutLine(line) ||
  isBlockquoteLine(line) ||
  isListLine(line);

function MarkdownLines({ lines }: { lines: string[] }) {
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code = [];
      index += 1;

      while (index < lines.length && !lines[index]?.startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }

      blocks.push(
        <pre
          key={index}
          className="overflow-x-auto bg-foreground p-4 text-sm text-bodytext dark:bg-foreground-dark dark:text-bodytext-dark"
        >
          <code>{code.join("\n")}</code>
        </pre>,
      );
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const depth = heading[1]?.length ?? 1;
      const Tag = `h${depth}` as keyof React.JSX.IntrinsicElements;

      blocks.push(
        <Tag
          key={index}
          className={clsx(
            "font-bold text-headingtext dark:text-headingtext-dark",
            depth === 1 && "mt-2 text-3xl",
            depth === 2 && "mt-10 text-2xl",
            depth > 2 && "mt-8 text-xl",
          )}
        >
          {inline(heading[2] ?? "")}
        </Tag>,
      );
      index += 1;
      continue;
    }

    if (isRuleLine(line)) {
      blocks.push(<hr key={index} className="border-hovered/30 dark:border-hovered-dark/30" />);
      index += 1;
      continue;
    }

    const start = index;
    const collect = (test: (value: string) => boolean) => {
      while (index < lines.length && test(lines[index] ?? "")) {
        index += 1;
      }

      return lines.slice(start, index);
    };

    if (isCalloutLine(line)) {
      blocks.push(callout(collect(isBlockquoteLine), start));
    } else if (isBlockquoteLine(line)) {
      blocks.push(blockquote(collect(isBlockquoteLine), start));
    } else if (isListLine(line)) {
      blocks.push(list(collect(isListLine), start));
    } else {
      blocks.push(paragraph(collect((value) => !startsNewBlock(value)), start));
    }
  }

  return <>{blocks}</>;
}

export function ObsidianMarkdown({ content }: ObsidianMarkdownProps) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-5 py-8">
      <MarkdownLines lines={content.replace(/\r\n/g, "\n").split("\n")} />
    </article>
  );
}
