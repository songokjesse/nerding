import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white transition-colors hover:text-zinc-300">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span>CareNotely</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Button asChild className="bg-white text-black hover:bg-zinc-200">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
