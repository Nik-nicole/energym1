"use client";

import { AdminSidebar } from "./admin-sidebar";
import { AuthGuard } from "@/components/auth-guard";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard requireAdmin={true}>
      <div className="flex h-screen bg-[#0A0A0A]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0A0A0A] p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
