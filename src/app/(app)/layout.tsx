import { requireProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar role={profile.role} email={profile.email} />
        <main className="flex-1 min-w-0 p-8 w-full max-w-[1450px] mx-auto max-md:p-5">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
