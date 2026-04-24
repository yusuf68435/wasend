import { requireAuth } from "@/lib/auth-helper";

export const metadata = {
  title: "Hoş Geldin — WaSend",
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
      <div className="max-w-[720px] mx-auto px-6 py-10 md:py-16">{children}</div>
    </div>
  );
}
