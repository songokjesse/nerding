import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black py-12 text-zinc-400">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-500" />
                        <span className="text-lg font-bold text-white">Nerding</span>
                    </div>

                    <div className="flex gap-8 text-sm">
                        <Link href="#" className="hover:text-white">Privacy</Link>
                        <Link href="#" className="hover:text-white">Terms</Link>
                        <Link href="#" className="hover:text-white">Contact</Link>
                    </div>

                    <div className="text-sm">
                        © {new Date().getFullYear()} Nerding. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
