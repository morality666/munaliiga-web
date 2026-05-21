import { createRootRouteWithContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return <h1 className="text-3xl font-bold underline">{t("helloWorld")}</h1>;
}
