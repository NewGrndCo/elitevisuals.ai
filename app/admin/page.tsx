import { AdminDashboard } from "@/components-next/admin-dashboard";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export default function AdminPage() {
  return <AdminDashboard />;
}
