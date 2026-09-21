import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "sakala-focus-ring inline-flex items-center justify-center gap-2 rounded-lg border text-[13px] font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150",
        "disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-8 px-3",
        size === "md" && "h-9 px-3.5",
        size === "lg" && "h-10 px-4",
        size === "icon" && "h-9 w-9 p-0",
        variant === "primary" &&
          "border-accent-teal bg-accent-teal text-accent-teal-ink hover:brightness-95 active:scale-[0.985]",
        variant === "secondary" &&
          "border-hairline-strong bg-surface text-ink hover:bg-surface-elevated active:bg-surface-focus",
        variant === "ghost" &&
          "border-transparent bg-transparent text-ink-muted hover:bg-surface/70 hover:text-ink",
        variant === "destructive" &&
          "border-status-blocked/30 bg-status-blocked text-white hover:brightness-95 active:scale-[0.985]",
        className,
      )}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : leadingIcon}
      {size !== "icon" && children}
      {!loading && trailingIcon}
    </button>
  );
}

export function IconButton({
  label,
  className,
  size = "md",
  ...props
}: Omit<ButtonProps, "children" | "size"> & { label: string; size?: "sm" | "md" }) {
  return (
    <Button
      {...props}
      aria-label={label}
      title={label}
      size="icon"
      className={cn(size === "sm" && "h-8 w-8", className)}
    />
  );
}

export function ButtonGroup({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>;
}
