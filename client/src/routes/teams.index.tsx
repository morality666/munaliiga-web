import { createFileRoute } from "@tanstack/react-router";
import { TeamsIndex } from "../teams/TeamsIndex.tsx";

export const Route = createFileRoute("/teams/")({
  component: TeamsIndex,
});
