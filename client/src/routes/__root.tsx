import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TopBar } from "../common/components/TopBar.tsx";
import clsx from "clsx";

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function NotFoundComponent() {
  const { t } = useTranslation();
  return <h1 className="text-3xl font-bold underline">{t("notFound")}</h1>;
}

// eslint-disable-next-line react-refresh/only-export-components
function RootComponent() {
  const backgroundElementClass = clsx(
    "min-h-screen",
    "w-full",
    "bg-background",
    "dark:bg-background-dark",
  );

  return (
    <div className={backgroundElementClass}>
      <TopBar />
      <Outlet />
    </div>
  );
}
