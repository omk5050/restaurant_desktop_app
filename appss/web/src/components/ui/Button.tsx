import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "success";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-primary text-white hover:bg-primary-dark",
  secondary: "border-border bg-card text-text hover:bg-panel hover:text-primary-dark",
  success: "border-transparent bg-green text-white hover:opacity-90",
};

export const Button = ({
  children,
  className,
  disabled = false,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      aria-busy={loading || undefined}
      aria-disabled={isDisabled}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border px-4 text-[0.8125rem] font-bold",
        "transition-[background-color,border-color,color,transform] duration-150 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "active:scale-95",
        "disabled:pointer-events-none disabled:opacity-[0.45]",
        variantClassName[variant],
        className,
      )}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {loading ? "Processing..." : children}
    </button>
  );
};
