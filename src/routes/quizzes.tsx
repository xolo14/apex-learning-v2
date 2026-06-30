import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout — child routes: /quizzes/ (list), /quizzes/$id (detail) */
export const Route = createFileRoute("/quizzes")({
  component: () => <Outlet />,
});
