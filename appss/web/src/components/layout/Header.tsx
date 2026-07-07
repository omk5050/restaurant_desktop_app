import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

export type HeaderProps = {
  eyebrow?: string;
  title: string;
  trailing?: ReactNode;
};

export const Header = ({ eyebrow, title, trailing }: HeaderProps) => (
  <header className="flex h-[4.25rem] items-center justify-between border-b border-border bg-card dark:bg-bg px-4">
    <div>
      {eyebrow && <p className="text-[0.625rem] font-bold uppercase tracking-widest text-primary mb-0.5">{eyebrow}</p>}
      <h1 className="text-[1.375rem] font-black leading-none text-text">{title}</h1>
    </div>
    <div className="flex items-center gap-3">
      {trailing}
      <IconButton label="Notifications">
        <Bell size={18} strokeWidth={2.7} />
      </IconButton>
    </div>
  </header>
);

export const IconButton = ({
  children,
  className,
  label,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  onClick?: () => void;
}) => (
  <button
    aria-label={label}
    className={cn(
      "flex size-9 items-center justify-center rounded-xl border border-border bg-card text-text-sec shadow-sm transition-[background-color,border-color,transform] duration-150 ease-out hover:bg-panel hover:text-primary active:scale-90",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      className,
    )}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);
