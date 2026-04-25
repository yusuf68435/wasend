import { requireAuth, requireOnboarded, getImpersonationState } from "@/lib/auth-helper";
import { Sidebar } from "@/components/sidebar";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { OnboardingReminderBanner } from "@/components/onboarding-reminder-banner";
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
  await requireOnboarded();
  const admin = await getSuperAdminOrNull();
  const impersonation = await getImpersonationState();

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] dark:bg-gray-950">
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
          <OnboardingReminderBanner />
          {children}
        </main>
      </div>
      <WelcomeModal />
      <CommandPalette isSuperAdmin={!!admin} />
    </div>
  );
}
