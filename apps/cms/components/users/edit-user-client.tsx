"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { UserForm } from "@/components/users/user-form";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import type { User } from "@cms-pwa/shared-types";

export function EditUserClient({ id }: { id: string }) {
  const { can } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.get<User>(`/users/${id}`).then(setUser).catch(() => setUser(null));
  }, [id]);

  if (!can("admin")) {
    return (
      <div>
        <PageHeader title="Edit User" />
        <p className="py-8 text-center text-sm text-muted-foreground">Only admins can manage users.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="Edit User" />
        <div className="relative z-10">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit User" description={user.name} />
      <div className="relative z-10">
        <UserForm initial={user} />
      </div>
    </div>
  );
}
