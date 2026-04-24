import { requireSuperAdmin } from "@/lib/admin-guard";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();

  return (
    <div
      data-admin
      className="flex min-h-screen bg-[#fbfbfd] text-[#1d1d1f]"
    >
      <AdminSidebar adminName={admin.name || admin.email} />
      <main className="flex-1 min-w-0 p-4 md:p-8 pt-16 md:pt-8 overflow-x-auto">
        {children}
      </main>
    </div>
  );
}
