import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "orange" | "blue" | "green" | "gray";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  label: string;
  tone?: BadgeTone;
};

const toneClassName: Record<BadgeTone, string> = {
  orange: "bg-primary-light text-primary",
  blue: "bg-blue-light text-blue",
  green: "bg-green-light text-green",
  gray: "bg-border/30 text-text-sec",
};

export const Badge = ({ className, label, tone = "orange", ...props }: BadgeProps) => (
  <span
    className={cn("inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[0.625rem] font-bold tracking-wide uppercase", toneClassName[tone], className)}
    {...props}
  >
    {label}
  </span>
);
