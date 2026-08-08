import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/sign-out-button";
import NavTabs from "@/components/nav-tabs";
import DatasetSwitcher from "@/components/dataset-switcher";
import { DatasetProvider } from "@/lib/dataset-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DatasetProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-slate-900">
                Land Leads Dashboard
              </Link>
              <NavTabs />
            </div>
            <div className="flex items-center gap-3">
              <DatasetSwitcher />
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </DatasetProvider>
  );
}
