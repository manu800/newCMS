"use client";

import { PageHeader } from "@/components/layout/page-header";
import { UserForm } from "@/components/users/user-form";
import { useAuth } from "@/hooks/use-auth";

export default function NewUserPage() {
  const { can } = useAuth();

  if (!can("admin")) {
    return (
      <div>
        <PageHeader title="New User" />
        <p className="py-8 text-center text-sm text-muted-foreground">Only admins can manage users.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="New User" description="Register a new CMS user." />
      <div className="relative z-10">
        <UserForm />
      </div>
    </div>
  );
}
