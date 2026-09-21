"use client";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export function PopoverContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return <PopoverPrimitive.Portal><PopoverPrimitive.Content {...props} sideOffset={sideOffset} className={cn("z-50 w-72 rounded-lg border border-hairline-strong bg-surface-overlay p-3 shadow-xl [animation:drawer-fade-in_120ms_ease-out]", className)} /></PopoverPrimitive.Portal>;
}
export const PopoverClose = PopoverPrimitive.Close;
