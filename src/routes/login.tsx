import { createFileRoute, Navigate } from "@tanstack/react-router";

// Email/password sign-in has been removed. Admin access is now PIN-only at /admin.
export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin — Elite Visuals" }] }),
  component: () => <Navigate to="/admin" replace />,
});
