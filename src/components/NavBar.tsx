"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, PlusCircle } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/data-entry", label: "Data Entry", icon: PlusCircle },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-6 h-12 flex items-center justify-between">
        <span className="font-bold text-sm tracking-tight">Hospital Analytics</span>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
