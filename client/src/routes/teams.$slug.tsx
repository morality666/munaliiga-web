import { createFileRoute, notFound } from "@tanstack/react-router";
import { TeamPage } from "../teams/TeamPage.tsx";
import { getTeam } from "../teams/teams.ts";

export const Route = createFileRoute("/teams/$slug")({
  component: TeamRoute,
  // Imported inside the loader rather than at the top of the file: route
  // loaders stay in the entry bundle, so a static import here would put the
  // team data and its YAML parser on every page of the site.
  loader: async ({ params }) => {
    const { hasTeam } = await import("../teams/teams.ts");

    if (!hasTeam(params.slug)) {
      throw notFound();
    }
  },
});

// eslint-disable-next-line react-refresh/only-export-components
function TeamRoute() {
  const { slug } = Route.useParams();
  const team = getTeam(slug);

  return team ? <TeamPage team={team} /> : null;
}
