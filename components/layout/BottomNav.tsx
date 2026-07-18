"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, FileText } from "lucide-react";

const items = [
  { href: "/", label: "Notities", icon: FileText },
  { href: "/notes/new", label: "Foto", icon: Camera },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur safe-bottom">
      <div className="mx-auto max-w-lg flex">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)]"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
