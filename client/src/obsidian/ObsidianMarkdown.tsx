import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { Info, Lightbulb, NotebookText, TriangleAlert } from "lucide-react";
import React from "react";
import { getObsidianAssetUrl } from "./notes.ts";

type ObsidianMarkdownProps = {
  content: string;
};

const calloutNames: Record<string, string> = {
  info: "Info",
  note: "Note",
  tip: "Tip",
  warning: "Warning",
};

const calloutStyles: Record<string, string> = {
  info: "bg-[#d8d5c7] text-stone-900 ring-stone-500/20",
  note: "bg-[#d8d5c7] text-stone-900 ring-stone-500/20",
  tip: "bg-[#d8dfc8] text-stone-900 ring-[#789469]/30",
  warning: "bg-[#ead6b3] text-stone-900 ring-[#dcae47]/30",
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

const renderImage = (src: string, alt: string, key: React.Key, size = "") => {
  const [width, height] = size.split("x");

  return (
    <img
      key={key}
      className="mx-auto my-6 max-h-128 w-auto max-w-full rounded-sm object-contain shadow-sm"
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
      return renderImage(src, src, index, size);
    }

    if (part.startsWith("![")) {
      const match = part.match(/^!\[([^\]]*)]\(([^)]+)\)$/);
      return renderImage(match?.[2] ?? "", match?.[1] ?? "", index);
    }

    if (part.startsWith("[[")) {
      const [reference = "", label = reference] = part.slice(2, -2).split("|");
      const [target = "", heading = ""] = reference.split("#");
      const slug = slugify(target);
      const hash = heading ? slugify(heading) : undefined;

      if (!slug) {
        return (
          <Link
            key={index}
            className="font-semibold text-[#1c1d19] underline underline-offset-4 hover:text-[#a95747]"
            hash={hash}
            to="/"
          >
            {label}
          </Link>
        );
      }

      return (
        <Link
          key={index}
          className="font-semibold text-[#1c1d19] underline underline-offset-4 hover:text-[#a95747]"
          hash={hash}
          params={{ slug }}
          to="/$slug"
        >
          {label}
        </Link>
      );
    }

    if (part.startsWith("[")) {
      const match = part.match(/^\[([^\]]+)]\(([^)]+)\)$/);

      return (
        <a
          key={index}
          className="font-semibold text-[#1c1d19] underline underline-offset-4 hover:text-[#a95747]"
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
          className="rounded-sm bg-[#dcd3c0] px-1.5 py-0.5 text-sm"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
};

const paragraph = (lines: string[], key: React.Key, lead = false) => (
  <p
    key={key}
    className={clsx(
      "leading-8 text-stone-700",
      lead && "text-lg font-medium text-stone-800",
    )}
  >
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
        "space-y-2 pl-7 leading-8 text-stone-700",
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
        "rounded-sm px-4 py-3 ring-1",
        calloutStyles[kind] ??
          "bg-[#d8d5c7] text-stone-900 ring-stone-500/20",
      )}
    >
      <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase">
        <Icon aria-hidden className="h-4 w-4" />
        {title}
      </p>
      <div className="space-y-3">
        <MarkdownLines lines={body} />
      </div>
    </aside>
  );
};

const blockquote = (lines: string[], key: React.Key) => (
  <blockquote
    key={key}
    className="border-l-4 border-[#a95747]/70 pl-4 italic leading-8 text-stone-700"
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
  const frontmatterEnd = lines.findIndex(
    (line, lineIndex) => lineIndex > 0 && line === "---",
  );
  let index = lines[0] === "---" && frontmatterEnd > 0 ? frontmatterEnd + 1 : 0;
  let previousBlockWasTitle = false;

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
          className="overflow-x-auto bg-[#dcd3c0] p-4 text-sm text-stone-800"
        >
          <code>{code.join("\n")}</code>
        </pre>,
      );
      index += 1;
      previousBlockWasTitle = false;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const depth = heading[1]?.length ?? 1;
      const Tag = `h${depth}` as keyof React.JSX.IntrinsicElements;

      blocks.push(
        <Tag
          key={index}
          id={slugify(heading[2] ?? "")}
          className={clsx(
            "font-bold text-[#1c1d19]",
            depth === 1 && "mt-2 text-4xl",
            depth === 2 && "mt-10 text-2xl",
            depth > 2 && "mt-8 text-xl",
          )}
        >
          {inline(heading[2] ?? "")}
        </Tag>,
      );
      index += 1;
      previousBlockWasTitle = depth === 1;
      continue;
    }

    if (isRuleLine(line)) {
      blocks.push(
        <hr
          key={index}
          className="my-4 border-stone-500/30"
        />,
      );
      index += 1;
      previousBlockWasTitle = false;
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
      blocks.push(
        paragraph(
          collect((value) => !startsNewBlock(value)),
          start,
          previousBlockWasTitle,
        ),
      );
    }
    previousBlockWasTitle = false;
  }

  return <>{blocks}</>;
}

export function ObsidianMarkdown({ content }: ObsidianMarkdownProps) {
  return (
    <main className="obsidian-page paper-field min-h-[calc(100svh-var(--spacing-card-height))] bg-[#e8e0ce]">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-12">
        <MarkdownLines lines={content.replace(/\r\n/g, "\n").split("\n")} />
      </article>
    </main>
  );
}
