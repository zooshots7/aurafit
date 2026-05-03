"use client";

import Link from "next/link";

interface NavbarProps {
  variant?: "light" | "dark";
}

export default function Navbar({ variant = "light" }: NavbarProps) {
  const textClass = variant === "dark" ? "text-surface-container-lowest" : "text-stone-600";
  const hoverClass = "hover:text-amber-600 transition-colors duration-300";

  return (
    <nav className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-md">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-8 py-6">
        <Link href="/" className="text-2xl font-serif italic tracking-tight text-amber-600">
          AuraFit
        </Link>
        <div className="hidden md:flex items-center gap-12 font-serif italic">
          <Link className={`${textClass} ${hoverClass}`} href="/">Explore</Link>
          <Link className={`${textClass} ${hoverClass}`} href="#">About</Link>
          <Link className={`${textClass} ${hoverClass}`} href="/account">My Profiles</Link>
          <Link
            href="/upload"
            className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label uppercase tracking-widest text-xs active:scale-95 duration-200 not-italic"
          >
            Get Started
          </Link>
        </div>
        <button className="md:hidden text-on-surface">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}
