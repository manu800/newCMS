"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/hooks/use-auth";
import { PropertyProvider } from "@/hooks/use-property";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <PropertyProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
        </div>
      </div>
    </PropertyProvider>
  );
}
