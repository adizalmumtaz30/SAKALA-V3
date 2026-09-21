"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
      <DialogPrimitive.Content {...props} className={cn("fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline-strong bg-surface-overlay p-5 shadow-2xl [animation:dialog-in_150ms_ease-out]", className)}>
        {children}
        <DialogPrimitive.Close aria-label="Tutup" className="sakala-focus-ring absolute right-3 top-3 rounded-md p-1.5 text-ink-faint hover:bg-surface-focus hover:text-ink"><X size={16} /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("pr-8", className)} />;
}

export function DialogTitle(props: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title {...props} className={cn("text-[16px] font-semibold tracking-tight text-ink", props.className)} />;
}

export function DialogDescription(props: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description {...props} className={cn("mt-1.5 text-[13px] leading-5 text-ink-muted", props.className)} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("mt-5 flex items-center justify-end gap-2", className)} />;
}

export const DialogClose = DialogPrimitive.Close;
