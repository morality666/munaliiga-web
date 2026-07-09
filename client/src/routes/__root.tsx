import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TopBar } from "../common/components/TopBar.tsx";
import clsx from "clsx";
import { StreamStatusProvider } from "../streaming/StreamStatus.tsx";

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <main className="paper-field min-h-[calc(100svh-var(--spacing-card-height))] bg-[#e8e0ce] px-5 py-12 text-[#1c1d19]">
      <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.035em]">
        {t("notFound")}
      </h1>
    </main>
  );
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
    <StreamStatusProvider>
      <div className={backgroundElementClass}>
        <TopBar />
        <div className="route-surface">
          <Outlet />
        </div>
      </div>
    </StreamStatusProvider>
  );
}
