"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { MediaPicker } from "@/components/shared/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api-client";
import type { User, UserRole } from "@cms-pwa/shared-types";

const ROLES: UserRole[] = ["admin", "editor", "designer", "viewer"];

interface FormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar: string;
  designation: string;
  is_author: boolean;
  is_active: boolean;
}

function toFormState(u?: User): FormState {
  return {
    name: u?.name ?? "",
    email: u?.email ?? "",
    password: "",
    role: u?.role ?? "viewer",
    avatar: u?.avatar ?? "",
    designation: u?.designation ?? "",
    is_author: u?.is_author ?? false,
    is_active: u?.is_active ?? true,
  };
}

export function UserForm({ initial }: { initial?: User }) {
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const isEditing = !!initial;

  const submit = async () => {
    if (!form.name || !form.email || (!isEditing && !form.password)) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        avatar: form.avatar || null,
        designation: form.designation || null,
        is_author: form.is_author,
        is_active: form.is_active,
      };
      if (isEditing) {
        await api.put(`/users/${initial.id}`, { ...payload, ...(form.password ? { password: form.password } : {}) });
        toast.success("User updated");
      } else {
        await api.post("/users", { ...payload, email: form.email, password: form.password });
        toast.success("User created");
      }
      router.push("/users");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)] sm:p-6">
        <div className="mb-6 flex items-center gap-4">
          {form.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar} alt="" className="h-16 w-16 rounded-full border object-cover" />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full border bg-muted" />
          )}
          <div className="flex-1 space-y-1.5">
            <Label>Avatar</Label>
            <div className="flex items-center gap-2">
              <Input
                value={form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
              />
              <MediaPicker type="image" value={form.avatar} onSelect={(asset) => setForm((f) => ({ ...f, avatar: asset.url }))} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>
              Name<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>
              Email<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              disabled={isEditing}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Password{!isEditing && <span className="ml-0.5 text-destructive">*</span>}
              {isEditing && <span className="ml-1 text-xs font-normal text-muted-foreground">(leave blank to keep unchanged)</span>}
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={isEditing ? "••••••••" : ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v: string) => setForm((f) => ({ ...f, role: v as UserRole }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Designation</Label>
            <Input
              value={form.designation}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
              placeholder="e.g. Senior Reporter"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
            <div>
              <Label>Active</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Disabled users can&apos;t log in.</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, is_active: v }))} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
            <div>
              <Label>Is Author</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Shows up in the Author picker on content forms.</p>
            </div>
            <Switch checked={form.is_author} onCheckedChange={(v: boolean) => setForm((f) => ({ ...f, is_author: v }))} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={() => router.push("/users")}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={saving || !form.name || !form.email || (!isEditing && !form.password)}
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </div>
  );
}
