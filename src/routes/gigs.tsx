import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gigs")({
  beforeLoad: () => {
    throw redirect({ to: "/quizzes", search: { tab: "gigs" } });
  },
  component: () => null,
});
