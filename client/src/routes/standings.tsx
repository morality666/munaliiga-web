import { createFileRoute } from "@tanstack/react-router";
import { StandingsPage } from "../standings/StandingsPage.tsx";

export const Route = createFileRoute("/standings")({
  component: StandingsPage,
});
