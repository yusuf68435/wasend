import { requireAuth, getImpersonationState } from "@/lib/auth-helper";
import { Sidebar } from "@/components/sidebar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { WelcomeModal } from "@/components/welcome-modal";
import { CommandPalette } from "@/components/command-palette";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { getSuperAdminOrNull } from "@/lib/admin-guard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const admin = await getSuperAdminOrNull();
  const impersonation = await getImpersonationState();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {impersonation.active && (
        <ImpersonationBanner
          targetEmail={impersonation.targetEmail}
          adminEmail={impersonation.adminEmail}
        />
      )}
      <div className="flex">
        <Sidebar isSuperAdmin={!!admin} />
        <main className="flex-1 min-w-0 p-4 md:p-8 pt-16 md:pt-8">
          <AnnouncementBanner />
          {children}
        </main>
      </div>
      <WelcomeModal />
      <CommandPalette isSuperAdmin={!!admin} />
    </div>
  );
}
