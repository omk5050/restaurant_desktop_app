import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export const Card = <T extends ElementType = "section">({
  as,
  children,
  className,
  ...props
}: CardProps<T>) => {
  const Component = as ?? "section";

  return (
    <Component
      className={cn("rounded-xl border border-border bg-card p-3 shadow-warm", className)}
      {...props}
    >
      {children}
    </Component>
  );
};
