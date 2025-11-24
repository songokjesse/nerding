import { Calendar, Users, FileText, Shield, Zap, Heart } from "lucide-react";

const features = [
    {
        name: "Smart Scheduling",
        description: "Drag-and-drop shift management that automatically detects conflicts and ensures compliance.",
        icon: Calendar,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    {
        name: "Client Management",
        description: "Keep all client details, documents, and care plans in one secure, accessible location.",
        icon: Users,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    {
        name: "Progress Notes",
        description: "Streamlined note-taking for workers with instant availability for coordinators.",
        icon: FileText,
        color: "text-pink-500",
        bg: "bg-pink-500/10",
    },
    {
        name: "Compliance Ready",
        description: "Built-in checks for NDIS standards to keep your organization audit-ready at all times.",
        icon: Shield,
        color: "text-green-500",
        bg: "bg-green-500/10",
    },
    {
        name: "Lightning Fast",
        description: "Optimized for speed so you spend less time waiting and more time caring.",
        icon: Zap,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
    },
    {
        name: "Worker Focused",
        description: "Designed with support workers in mind, making their daily tasks simple and intuitive.",
        icon: Heart,
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
];

export function Features() {
    return (
        <section id="features" className="bg-black py-24 text-white">
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                        Everything you need to run your <br />
                        <span className="text-zinc-400">NDIS business</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-zinc-400">
                        Powerful tools designed to replace spreadsheets and fragmented systems.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.name}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 transition-all hover:border-white/20 hover:bg-zinc-900"
                        >
                            <div className={`mb-4 inline-flex rounded-xl p-3 ${feature.bg}`}>
                                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">{feature.name}</h3>
                            <p className="text-zinc-400">{feature.description}</p>

                            {/* Hover Glow Effect */}
                            <div className="absolute -right-4 -bottom-4 -z-10 h-32 w-32 rounded-full bg-white/5 blur-2xl transition-all group-hover:bg-white/10" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
