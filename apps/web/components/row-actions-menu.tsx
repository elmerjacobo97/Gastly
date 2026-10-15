"use client";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowActionsMenuProps = {
  onEdit?: () => void;
  onDelete: () => void;
  additionalActions?: {
    icon: ReactNode;
    label: string;
    onSelect: () => void;
    separatorBefore?: boolean;
  }[];
  editLabel?: string;
  className?: string;
};

export function RowActionsMenu({
  onEdit,
  onDelete,
  additionalActions,
  editLabel = "Editar",
  className,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className={className}>
          <MoreHorizontalIcon />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        {onEdit && (
          <DropdownMenuItem onSelect={onEdit}>
            <PencilIcon />
            {editLabel}
          </DropdownMenuItem>
        )}
        {additionalActions?.map((action) => (
          <Fragment key={action.label}>
            {action.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={action.onSelect}>
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2Icon />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
