import clsx from "clsx";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { signupsAreLive, siteConfig } from "../../config.ts";
import { getObsidianNotes } from "../../obsidian/notes.ts";
import { useStreamStatus } from "../../streaming/StreamStatus.tsx";

const languages = [
  { code: "en", label: "English" },
  { code: "fi", label: "Suomi" },
] as const;

const communityCategories = ["articles", "guides", "other"] as const;

const EnglishFlag = () => (
  <svg
    aria-hidden
    className="h-3.5 w-5 sm:h-4 sm:w-7"
    viewBox="0 0 28 16"
  >
    <rect width="28" height="16" fill="#24345d" />
    <path d="M0 0 28 16M28 0 0 16" stroke="#eee9dc" strokeWidth="4" />
    <path d="M0 0 28 16M28 0 0 16" stroke="#a94a43" strokeWidth="1.7" />
    <path d="M14 0V16M0 8H28" stroke="#eee9dc" strokeWidth="5" />
    <path d="M14 0V16M0 8H28" stroke="#a94a43" strokeWidth="2.5" />
  </svg>
);

const FinnishFlag = () => (
  <svg
    aria-hidden
    className="h-3.5 w-5 sm:h-4 sm:w-7"
    viewBox="0 0 28 16"
  >
    <rect width="28" height="16" fill="#eee9dc" />
    <path d="M9 0V16M0 8H28" stroke="#31598f" strokeWidth="4" />
  </svg>
);

const DiscordLogo = () => (
  <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M8.1 6.2A13 13 0 0 1 12 5.6a13 13 0 0 1 3.9.6l.5-1a15 15 0 0 1 3.1 1.2c2 2.9 2.5 5.8 2.2 8.7a12 12 0 0 1-3.8 2.5l-.9-1.2c.7-.3 1.3-.7 1.9-1.2a9.8 9.8 0 0 1-6.9 2.4 9.8 9.8 0 0 1-6.9-2.4c.6.5 1.2.9 1.9 1.2l-.9 1.2a12 12 0 0 1-3.8-2.5c-.3-2.9.2-5.8 2.2-8.7a15 15 0 0 1 3.1-1.2Zm.3 5.6c0 .9.6 1.6 1.4 1.6s1.4-.7 1.4-1.6-.6-1.6-1.4-1.6-1.4.7-1.4 1.6Zm4.4 0c0 .9.6 1.6 1.4 1.6s1.4-.7 1.4-1.6-.6-1.6-1.4-1.6-1.4.7-1.4 1.6Z"
      fill="currentColor"
    />
  </svg>
);

const YouTubeLogo = () => (
  <svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8ZM10 15.2V8.8l5.4 3.2Z"
      fill="currentColor"
    />
  </svg>
);

export const TopBar = () => {
  const { i18n, t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(() =>
    pathname.startsWith("/community-"),
  );
  const [openCommunityCategory, setOpenCommunityCategory] = useState<
    (typeof communityCategories)[number] | null
  >(
    () =>
      communityCategories.find((category) =>
        pathname.startsWith(`/community-${category}`),
      ) ?? null,
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const { featuredChannel, isLive, liveChannels } = useStreamStatus();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const allPages = getObsidianNotes(activeLanguage).filter((page) => page.slug);
  const pages = allPages.filter((page) => !page.section);
  const communityPages = allPages.filter(
    (page) => page.section === "community",
  );

  useEffect(() => {
    if (pathname.startsWith("/community-")) {
      setCommunityOpen(true);
      setOpenCommunityCategory(
        communityCategories.find((category) =>
          pathname.startsWith(`/community-${category}`),
        ) ?? null,
      );
    }
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !menuRef.current?.contains(target) &&
        !menuButtonRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const changeLanguage = (language: string) => {
    localStorage.setItem("language", language);
    void i18n.changeLanguage(language);
  };

  const closeMenu = () => setMenuOpen(false);

  const topBarClass = clsx(
    "select-none",
    "h-card-height",
    "w-full",
    "content-center",
    "sticky",
    "px-2",
    "sm:px-4",
    "top-0",
    "grid",
    "grid-cols-[minmax(2.5rem,1fr)_auto_minmax(0,1fr)]",
    "items-center",
    "z-30",
    "border-b",
    "border-stone-700",
    "bg-[#191b16]",
  );

  const logoTextClass = clsx(
    "cursor-pointer",
    "text-[#f1eadc]",
    "font-logo",
    "text-lg",
    "leading-none",
    "text-center",
    "transition-colors",
    "hover:text-[#dcae47]",
    "sm:text-xl",
  );

  const wardImageClass = clsx(
    "pointer-events-none",
    "h-9",
    "w-9",
    "transition",
    "sm:h-10",
    "sm:w-10",
    isLive &&
      "animate-pulse drop-shadow-[0_0_8px_rgba(228,173,55,0.95)] motion-reduce:animate-none",
  );

  const logoTextHolderClass = clsx("min-w-0", "justify-self-center");

  const languageToggleClass = clsx(
    "flex",
    "items-center",
    "gap-1",
    "text-xs",
    "font-semibold",
  );

  const languageButtonClass = (language: string) =>
    clsx(
      "group",
      "grid",
      "place-items-center",
      "cursor-pointer",
      "rounded-sm",
      "border",
      "px-0.5",
      "py-0.5",
      "sm:px-1.5",
      "sm:py-1",
      "shadow-sm",
      "transition-[background-color,border-color,transform]",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-[#e5bb5f]",
      activeLanguage.startsWith(language)
        ? "border-[#e5bb5f] bg-[#dcae47] [&_svg]:saturate-100"
        : "border-stone-600 bg-stone-800/60 [&_svg]:opacity-75 [&_svg]:saturate-[0.7] hover:-translate-y-px hover:border-stone-400 hover:bg-stone-800 hover:[&_svg]:opacity-100 hover:[&_svg]:saturate-100",
    );

  const menuIconHolderClass = clsx(
    "h-9",
    "w-9",
    "place-content-center",
    "sm:h-10",
    "sm:w-10",
  );

  const menuButtonClass = clsx(
    menuIconHolderClass,
    "grid",
    "cursor-pointer",
    "rounded-sm",
    "transition-colors",
    "hover:bg-stone-800",
  );

  const menuIconClass = clsx(
    "stroke-stone-300",
    "hover:stroke-[#f1eadc]",
  );

  const pageLinkClass = clsx(
    "block",
    "cursor-pointer",
    "rounded-sm",
    "px-3",
    "py-3",
    "text-sm",
    "font-semibold",
    "text-[#1c1d19]",
    "border-l-2",
    "border-transparent",
    "transition-[color,background-color,border-color,transform,opacity]",
    "duration-150",
    "ease-out",
    "hover:bg-[#dcd3c0]",
    "hover:text-[#a95747]",
    "hover:border-[#a95747]",
    "hover:translate-x-1",
  );

  const renderPageLink = (page: (typeof pages)[number]) => {
    return (
      <Link
        key={page.slug}
        className={pageLinkClass}
        onClick={closeMenu}
        params={{ slug: page.slug }}
        preload="render"
        to="/$slug"
      >
        {page.title}
      </Link>
    );
  };

  const renderCommunityLink = (page: (typeof communityPages)[number]) => (
    <Link
      key={page.slug}
      className={clsx(
        pageLinkClass,
        "ml-8 py-2 text-xs font-medium",
      )}
      onClick={closeMenu}
      params={{ slug: page.slug }}
      preload="render"
      to="/$slug"
    >
      {page.title}
    </Link>
  );

  const signupStatus = (
    <span
      aria-hidden
      className="flex flex-col items-end text-right font-mono text-[8px] font-bold uppercase leading-[9px] tracking-wide"
    >
      <span className="text-stone-400">
        <span className="hidden sm:inline">
          {t("season", { season: siteConfig.signup.season })}
        </span>
        <span className="sm:hidden">
          {t("seasonShort", { season: siteConfig.signup.season })}
        </span>
      </span>
      <span className={signupsAreLive ? "text-[#dcae47]" : "text-stone-400"}>
        <span className="hidden sm:inline">
          {t(signupsAreLive ? "signupsLive" : "signupsSoon")}
        </span>
        <span className="sm:hidden">
          {t(signupsAreLive ? "signupsLiveShort" : "signupsSoonShort")}
        </span>
      </span>
    </span>
  );
  const signupStatusLabel = `${t("season", {
    season: siteConfig.signup.season,
  })}. ${t(signupsAreLive ? "signupsLive" : "signupsSoon")}`;
  const signupStatusWrapperClass =
    "hidden min-[340px]:inline-flex shrink-0 items-center text-right leading-none";

  return (
    <>
      <header className={topBarClass}>
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden justify-self-start sm:gap-2">
          <img
            className={wardImageClass}
            src="/ward.png"
            alt={t("wardImageAltText")}
          />
          {isLive && featuredChannel ? (
            <a
              aria-live="polite"
              className="flex min-w-0 items-center gap-1.5 overflow-hidden border border-red-500/40 bg-red-500/10 px-1.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-red-600 sm:px-2 sm:text-[10px] dark:text-red-400"
              href={`https://www.twitch.tv/${featuredChannel}`}
              rel="noreferrer"
              target="_blank"
              title={liveChannels.join(", ")}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
              <span className="truncate">{t("live")} · {featuredChannel}</span>
            </a>
          ) : null}
        </div>
        <div className={logoTextHolderClass}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <h1 className={logoTextClass}>{t("munaliiga")}</h1>
          </Link>
        </div>
        <div className="flex min-w-0 items-center justify-self-end">
          <div className="mr-1 flex shrink-0 items-center justify-end gap-1 sm:mr-2 sm:gap-1.5">
            {signupsAreLive ? (
              <a
                aria-label={signupStatusLabel}
                className={signupStatusWrapperClass}
                href={siteConfig.signup.url}
                rel="noreferrer"
                target="_blank"
                title={t("signupsLive")}
              >
                {signupStatus}
              </a>
            ) : (
              <span
                aria-label={signupStatusLabel}
                className={signupStatusWrapperClass}
                role="status"
                title={siteConfig.signup.opensAt ?? undefined}
              >
                {signupStatus}
              </span>
            )}
            <div className={languageToggleClass}>
              {languages.map(({ code, label }) => (
                <button
                  key={code}
                  aria-label={label}
                  aria-pressed={activeLanguage.startsWith(code)}
                  className={languageButtonClass(code)}
                  onClick={() => changeLanguage(code)}
                  title={label}
                  type="button"
                >
                  {code === "en" ? <EnglishFlag /> : <FinnishFlag />}
                </button>
              ))}
            </div>
          </div>
          <button
            aria-expanded={menuOpen}
            aria-label={t("menu")}
            className={menuButtonClass}
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            <Menu className={menuIconClass} aria-hidden />
          </button>
        </div>
      </header>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 top-card-height z-40 overflow-hidden"
      >
        <aside
          className={clsx(
            "paper-field pointer-events-auto absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-l border-stone-900/20 bg-[#e8e0ce] shadow-[-8px_0_24px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
          ref={menuRef}
        >
          <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-2">
            <Link
              className={pageLinkClass}
              onClick={closeMenu}
              to="/"
            >
              {t("home")}
            </Link>
            {pages.map(renderPageLink)}
            {communityPages.length > 0 ? (
              <div>
                <button
                  aria-expanded={communityOpen}
                  className={clsx(
                    pageLinkClass,
                    "flex w-full items-center justify-between text-left",
                  )}
                  onClick={() => setCommunityOpen((open) => !open)}
                  type="button"
                >
                  {t("communityContent")}
                  <ChevronDown
                    aria-hidden
                    className={clsx(
                      "h-4 w-4 transition-transform duration-150",
                      communityOpen && "rotate-180",
                    )}
                  />
                </button>
                {communityOpen
                  ? communityCategories.map((category) => {
                      const categoryPage = communityPages.find(
                        (page) => page.category === category && page.isIndex,
                      );
                      const categoryChildren = communityPages.filter(
                        (page) => page.category === category && !page.isIndex,
                      );

                      if (!categoryPage) {
                        return null;
                      }

                      const categoryOpen = openCommunityCategory === category;

                      return (
                        <div key={category}>
                          <div className="flex items-center">
                            <Link
                              className={clsx(
                                pageLinkClass,
                                "ml-4 flex-1 py-2 text-xs",
                              )}
                              onClick={closeMenu}
                              params={{ slug: categoryPage.slug }}
                              preload="render"
                              to="/$slug"
                            >
                              {categoryPage.title}
                            </Link>
                            <button
                              aria-label={`${categoryPage.title} — ${t("toggleChildren")}`}
                              aria-expanded={categoryOpen}
                              className="mr-2 grid h-8 w-8 place-items-center text-stone-600 transition hover:bg-[#dcd3c0] hover:text-[#a95747]"
                              onClick={() =>
                                setOpenCommunityCategory((openCategory) =>
                                  openCategory === category ? null : category,
                                )
                              }
                              type="button"
                            >
                              <ChevronDown
                                aria-hidden
                                className={clsx(
                                  "h-3.5 w-3.5 transition-transform duration-150",
                                  categoryOpen && "rotate-180",
                                )}
                              />
                            </button>
                          </div>
                          {categoryOpen
                            ? categoryChildren.map(renderCommunityLink)
                            : null}
                        </div>
                      );
                    })
                  : null}
              </div>
            ) : null}
          </nav>
          <footer className="flex items-center gap-2 border-t border-stone-900/20 px-4 py-3">
            <a
              aria-label="Discord"
              className="grid h-9 w-9 place-items-center border border-stone-500/50 bg-[#dcd3c0] text-[#4d5570] transition hover:-translate-y-px hover:border-[#4d5570] hover:bg-[#d3cab8]"
              href={siteConfig.discordUrl}
              rel="noreferrer"
              target="_blank"
              title="Discord"
            >
              <DiscordLogo />
            </a>
            <a
              aria-label="YouTube"
              className="grid h-9 w-9 place-items-center border border-stone-500/50 bg-[#dcd3c0] text-[#a94435] transition hover:-translate-y-px hover:border-[#a94435] hover:bg-[#d3cab8]"
              href={siteConfig.youtubeUrl}
              rel="noreferrer"
              target="_blank"
              title="YouTube"
            >
              <YouTubeLogo />
            </a>
          </footer>
        </aside>
      </div>
    </>
  );
};
