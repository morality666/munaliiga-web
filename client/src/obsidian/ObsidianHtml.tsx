type ObsidianHtmlProps = {
  content: string;
};

export function ObsidianHtml({ content }: ObsidianHtmlProps) {
  return (
    <main className="obsidian-page paper-field min-h-[calc(100svh-var(--spacing-card-height))] bg-[#e8e0ce] text-[#1c1d19]">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </main>
  );
}
