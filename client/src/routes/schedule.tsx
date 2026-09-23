import { createFileRoute } from "@tanstack/react-router";
import { SchedulePage } from "../schedule/SchedulePage.tsx";

export const Route = createFileRoute("/schedule")({
  component: SchedulePage,
});
