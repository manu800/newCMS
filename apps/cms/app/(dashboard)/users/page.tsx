"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api-client";
import type { User } from "@cms-pwa/shared-types";

export default function UsersPage() {
  const { can } = useAuth();
  const isAdmin = can("admin");
  const [users, setUsers] = useState<User[] | null>(null);

  const load = () => {
    api.get<User[]>("/users").then(setUsers).catch(() => setUsers([]));
  };

  useEffect(load, []);

  const remove = async (u: User) => {
    if (!confirm(`Delete "${u.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("User deleted");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to delete user");
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Users" description="Manage CMS users." />
        <p className="py-8 text-center text-sm text-muted-foreground">Only admins can manage users.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Register CMS users, set their role, and flag which ones appear as Authors on content."
        actions={
          <Button asChild>
            <Link href="/users/new">+ New User</Link>
          </Button>
        }
      />

      <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(users ?? []).map((u) => (
              <TableRow key={u.id}>
                <TableCell className="flex items-center gap-2 font-medium">
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt="" className="h-6 w-6 rounded-full border object-cover" />
                  ) : (
                    <div className="h-6 w-6 shrink-0 rounded-full border bg-muted" />
                  )}
                  {u.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? "secondary" : "outline"}>{u.is_active ? "Active" : "Disabled"}</Badge>
                </TableCell>
                <TableCell>{u.is_author && <Badge>Author</Badge>}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/users/${u.id}/edit`}>Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => remove(u)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No users yet — create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
