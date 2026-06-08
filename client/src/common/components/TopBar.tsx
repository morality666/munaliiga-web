import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Menu } from "lucide-react";

export const TopBar = () => {
  const { t } = useTranslation();

  const topBarClass = clsx(
    "select-none",
    "h-card-height",
    "w-full",
    "content-center",
    "sticky",
    "px-4",
    "shadow-sm",
    "shadow-background",
    "dark:shadow-background-dark",
    "top-0",
    "flex",
    "items-center",
    "z-30",
    "bg-midground",
    "dark:bg-midground-dark",
  );

  const logoTextClass = clsx(
    "pointer-events-none",
    "text-headingtext",
    "dark:text-headingtext-dark",
    "font-logo",
    "text-xl",
    "text-center",
  );

  const wardImageClass = clsx("pointer-events-none", "h-10", "w-10");

  const logoTextHolderClass = clsx("grow", "justify-center");

  const menuIconHolderClass = clsx("h-10", "w-10", "place-content-center");

  const menuIconClass = clsx(
    "stroke-interactive",
    "hover:stroke-hovered",
    "dark:stroke-interactive-dark",
    "dark:hover:stroke-hovered-dark",
  );

  return (
    <header className={topBarClass}>
      <img
        className={wardImageClass}
        src="/ward.png"
        alt={t("wardImageAltText")}
      />
      <div className={logoTextHolderClass}>
        <h1 className={logoTextClass}>{t("munaliiga")}</h1>
      </div>
      <div className={menuIconHolderClass}>
        <Menu className={menuIconClass} aria-label={t("menu")} />
      </div>
    </header>
  );
};
