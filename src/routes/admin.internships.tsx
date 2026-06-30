import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/internships")({
  component: () => <Navigate to="/admin/leads" search={{ tab: "internships" }} />,
});