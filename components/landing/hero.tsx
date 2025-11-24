import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
    return (
        <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-black px-4 pt-24 text-center">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[120px]" />
            <div className="absolute top-0 right-0 -z-10 h-[400px] w-[400px] bg-blue-500/10 blur-[100px]" />
            <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] bg-pink-500/10 blur-[100px]" />

            <div className="container relative z-10 mx-auto max-w-4xl">
                <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400 backdrop-blur-sm">
                    <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500"></span>
                    Now available for NDIS Providers
                </div>

                <h1 className="mb-8 text-5xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl">
                    Simplify Your <br />
                    <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                        Care Management
                    </span>
                </h1>

                <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl">
                    The all-in-one platform for NDIS providers. Schedule shifts, manage clients, and track progress notes with an interface that feels like magic.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button asChild size="lg" className="h-12 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-zinc-200">
                        <Link href="/sign-up">
                            Start for free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-12 rounded-full border-zinc-800 bg-transparent px-8 text-base text-white hover:bg-zinc-900">
                        <Link href="#features">
                            Learn more
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </section>
    );
}
