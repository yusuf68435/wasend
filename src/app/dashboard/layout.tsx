import { requireAuth } from "@/lib/auth-helper";
import { Sidebar } from "@/components/sidebar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { WelcomeModal } from "@/components/welcome-modal";
import { CommandPalette } from "@/components/command-palette";
import { getSuperAdminOrNull } from "@/lib/admin-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const admin = await getSuperAdminOrNull();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar isSuperAdmin={!!admin} />
      <main className="flex-1 p-8">
        <AnnouncementBanner />
        {children}
      </main>
      <WelcomeModal />
      <CommandPalette isSuperAdmin={!!admin} />
    </div>
  );
}
