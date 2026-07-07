import { BarChart3, Home, ReceiptText, Utensils } from "lucide-react";
import type { SidebarItemId } from "@/components/layout";
import { cn } from "@/lib/cn";

const items = [
  { icon: Home, id: "tables", label: "Home" },
  { icon: Utensils, id: "menu", label: "Menu" },
  { icon: ReceiptText, id: "orders", label: "Orders" },
  { icon: BarChart3, id: "reports", label: "Reports" },
] as const;

export const BottomNav = ({
  activeItem,
  onNavigate,
}: {
  activeItem: SidebarItemId;
  onNavigate: (item: SidebarItemId) => void;
}) => (
  <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card px-4 py-2 lg:hidden" aria-label="Primary">
    <div className="mx-auto grid max-w-[38.75rem] grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = activeItem === item.id;

        return (
          <button
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-150 active:scale-95 p-2",
              selected ? "text-primary" : "text-text-sec hover:text-text",
            )}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <Icon aria-hidden="true" size={20} strokeWidth={selected ? 3 : 2.5} />
            <span className="text-[0.625rem] font-bold uppercase tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
