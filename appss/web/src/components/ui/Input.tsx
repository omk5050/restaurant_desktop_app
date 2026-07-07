import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, type = "text", ...props }: InputProps) => (
  <input
    className={cn(
      "h-10 rounded-xl border border-border bg-card px-3 text-[0.8125rem] font-medium text-text shadow-none outline-none transition-colors",
      "placeholder:text-text-sec/50 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      "disabled:cursor-not-allowed disabled:opacity-[0.45]",
      className,
    )}
    type={type}
    {...props}
  />
);
