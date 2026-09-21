"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;

export function DropdownMenuContent({ className, ...props }: ComponentProps<typeof Dropdown.Content>) {
  return <Dropdown.Portal><Dropdown.Content {...props} sideOffset={6} className={cn("z-50 min-w-40 rounded-lg border border-hairline-strong bg-surface-overlay p-1.5 shadow-xl [animation:drawer-fade-in_120ms_ease-out]", className)} /></Dropdown.Portal>;
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof Dropdown.Item>) {
  return <Dropdown.Item {...props} className={cn("flex min-h-8 cursor-default select-none items-center rounded-md px-2.5 py-1.5 text-[13px] text-ink outline-none data-[highlighted]:bg-surface-focus data-[disabled]:pointer-events-none data-[disabled]:opacity-40", className)} />;
}

export const DropdownMenuSeparator = Dropdown.Separator;
export const DropdownMenuLabel = Dropdown.Label;
