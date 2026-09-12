"use client";

import { LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useProperty } from "@/hooks/use-property";

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  editor: "bg-blue-500/10 text-blue-600",
  designer: "bg-purple-500/10 text-purple-600",
  viewer: "bg-slate-500/10 text-slate-600",
};

export function Topbar() {
  const { user, logout } = useAuth();
  const { properties, current, setCurrentId } = useProperty();

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3">
        {properties.length > 0 && (
          <Select value={current?.id} onValueChange={setCurrentId}>
            <SelectTrigger size="sm" className="w-48 border-none bg-muted/60 font-medium">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <Badge className={cn("capitalize", ROLE_STYLES[user.role] ?? "bg-secondary text-secondary-foreground")}>
            {user.role}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {initials || <User className="h-4 w-4" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name ?? "Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
