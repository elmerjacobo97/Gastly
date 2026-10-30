"use client";

import { LogOutIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type UserMenuProps = {
  userEmail?: string;
  userName?: string;
  signOutAction?: (formData: FormData) => void | Promise<void>;
};

export function UserMenu({
  userEmail,
  userName,
  signOutAction,
}: UserMenuProps) {
  const displayName = userName || userEmail?.split("@")[0] || "Usuario";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Menú de usuario"
            className="size-8 rounded-full p-0"
            variant="ghost"
          />
        }
      >
        <Avatar className="size-8 after:hidden">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="grid px-2 py-1.5 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              {userEmail && (
                <span className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/settings" className="flex items-center gap-2" />}
        >
          <Settings2Icon className="size-4" />
          Configuración
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <form
              action={signOutAction ?? (async () => {})}
              className="w-full"
            />
          }
        >
          <Button
            type="submit"
            variant="ghost"
            className="h-auto w-full justify-start gap-2 p-0 font-normal"
          >
            <LogOutIcon className="size-4" />
            Cerrar sesión
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
