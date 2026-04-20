import { requireSuperAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar adminName={admin.name || admin.email} />
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
