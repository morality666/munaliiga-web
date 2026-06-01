import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

export const Route = createFileRoute("/")({
  component: MainView,
});

// eslint-disable-next-line react-refresh/only-export-components
function MainView() {
  const { t } = useTranslation();

  const helloWorldElementClass = clsx(
    "text-md",
    "font-semibold",
    "text-bodytext",
    "dark:text-bodytext-dark",
  );

  return <h1 className={helloWorldElementClass}>{t("helloWorld")}</h1>;
}
