import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getObsidianNotes } from "../../obsidian/notes.ts";

const languages = ["en", "fi"];

export const TopBar = () => {
  const { i18n, t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const pages = getObsidianNotes(activeLanguage);

  const changeLanguage = (language: string) => {
    localStorage.setItem("language", language);
    void i18n.changeLanguage(language);
  };

  const closeMenuOnMobile = () => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setMenuOpen(false);
    }
  };

  const topBarClass = clsx(
    "select-none",
    "h-card-height",
    "w-full",
    "content-center",
    "sticky",
    "px-4",
    "top-0",
    "flex",
    "items-center",
    "z-30",
    "bg-midground",
    "dark:bg-midground-dark",
    "shadow-sm",
    "shadow-background",
    "dark:shadow-background-dark",
  );

  const logoTextClass = clsx(
    "cursor-pointer",
    "text-headingtext",
    "dark:text-headingtext-dark",
    "font-logo",
    "text-xl",
    "text-center",
    "transition-colors",
    "hover:text-hovered",
    "dark:hover:text-hovered-dark",
  );

  const wardImageClass = clsx("pointer-events-none", "h-10", "w-10");

  const logoTextHolderClass = clsx("grow", "justify-center");

  const languageToggleClass = clsx(
    "mr-3",
    "flex",
    "items-center",
    "gap-1",
    "text-xs",
    "font-semibold",
  );

  const languageButtonClass = (language: string) =>
    clsx(
      "cursor-pointer",
      "rounded-sm",
      "px-2",
      "py-1",
      "text-interactive",
      "dark:text-interactive-dark",
      "transition-colors",
      "hover:bg-foreground",
      "hover:text-hovered",
      "dark:hover:bg-foreground-dark",
      "dark:hover:text-hovered-dark",
      activeLanguage.startsWith(language) &&
        "bg-foreground text-headingtext dark:bg-foreground-dark dark:text-headingtext-dark",
    );

  const menuIconHolderClass = clsx("h-10", "w-10", "place-content-center");

  const menuButtonClass = clsx(
    menuIconHolderClass,
    "grid",
    "cursor-pointer",
    "rounded-sm",
    "transition-colors",
    "hover:bg-foreground",
    "dark:hover:bg-foreground-dark",
  );

  const menuIconClass = clsx(
    "stroke-interactive",
    "hover:stroke-hovered",
    "dark:stroke-interactive-dark",
    "dark:hover:stroke-hovered-dark",
  );

  const pageLinkClass = clsx(
    "block",
    "cursor-pointer",
    "rounded-sm",
    "px-3",
    "py-3",
    "text-sm",
    "font-semibold",
    "text-interactive",
    "transition-all",
    "duration-200",
    "ease-out",
    "hover:bg-foreground",
    "hover:text-hovered",
    "dark:text-interactive-dark",
    "dark:hover:bg-foreground-dark",
    "dark:hover:text-hovered-dark",
    menuOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
  );

  const pageLinkStyle = (index: number) => ({
    transitionDelay: menuOpen ? `${80 + index * 35}ms` : "0ms",
  });

  const renderPageLink = (page: (typeof pages)[number], index: number) => {
    if (!page.slug) {
      return (
        <Link
          key="home"
          className={pageLinkClass}
          onClick={closeMenuOnMobile}
          style={pageLinkStyle(index)}
          to="/"
        >
          {page.title}
        </Link>
      );
    }

    return (
      <Link
        key={page.slug}
        className={pageLinkClass}
        onClick={closeMenuOnMobile}
        params={{ slug: page.slug }}
        style={pageLinkStyle(index)}
        to="/$slug"
      >
        {page.title}
      </Link>
    );
  };

  return (
    <>
      <header className={topBarClass}>
        <img
          className={wardImageClass}
          src="/ward.png"
          alt={t("wardImageAltText")}
        />
        <div className={logoTextHolderClass}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <h1 className={logoTextClass}>{t("munaliiga")}</h1>
          </Link>
        </div>
        <div className={languageToggleClass}>
          {languages.map((language) => (
            <button
              key={language}
              className={languageButtonClass(language)}
              onClick={() => changeLanguage(language)}
              type="button"
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          aria-expanded={menuOpen}
          aria-label={t("menu")}
          className={menuButtonClass}
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <Menu className={menuIconClass} aria-hidden />
        </button>
      </header>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 top-card-height z-40 overflow-hidden"
      >
        <aside
          className={clsx(
            "pointer-events-auto absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-midground shadow-sm shadow-background transition-transform duration-300 ease-out dark:bg-midground-dark dark:shadow-background-dark",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <nav className="overflow-x-hidden overflow-y-auto px-3 py-2">
            {pages.map(renderPageLink)}
          </nav>
        </aside>
      </div>
    </>
  );
};
