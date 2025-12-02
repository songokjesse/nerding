import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, FileText, Settings, AlertTriangle } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"

async function getRulesStats() {
    try {
        // Get counts for credentials and requirements
        const [totalCredentials, expiringCredentials, totalRequirements] = await Promise.all([
            prisma.workerCredential.count().catch(() => 0),
            prisma.workerCredential.count({
                where: {
                    expiryDate: {
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        gte: new Date()
                    }
                }
            }).catch(() => 0),
            prisma.clientRequirement.count().catch(() => 0)
        ])

        return {
            totalCredentials,
            expiringCredentials,
            totalRequirements
        }
    } catch (error) {
        // Return zeros if tables don't exist yet (during migration)
        console.error('Error fetching rules stats:', error)
        return {
            totalCredentials: 0,
            expiringCredentials: 0,
            totalRequirements: 0
        }
    }
}

export default async function RulesPage() {
    const stats = await getRulesStats()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Rostering Rules Engine</h1>
                <p className="text-muted-foreground">
                    Configure NDIS compliance rules, worker credentials, and client requirements.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Credentials
                        </CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCredentials}</div>
                        <p className="text-xs text-muted-foreground">
                            Worker certifications on file
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Expiring Soon
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.expiringCredentials}</div>
                        <p className="text-xs text-muted-foreground">
                            Credentials expiring in 30 days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Client Requirements
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRequirements}</div>
                        <p className="text-xs text-muted-foreground">
                            Configured support requirements
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Configuration Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Worker Credentials */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <CardTitle>Worker Credentials</CardTitle>
                        </div>
                        <CardDescription>
                            Manage worker certifications, qualifications, and compliance documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Credential Types:</h4>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">NDIS Worker Screening</Badge>
                                <Badge variant="outline">Working with Children</Badge>
                                <Badge variant="outline">First Aid/CPR</Badge>
                                <Badge variant="outline">High-Intensity Support</Badge>
                                <Badge variant="outline">Manual Handling</Badge>
                                <Badge variant="outline">PBS Training</Badge>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/dashboard/members"
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Go to Workers → Select a worker → View Credentials
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Client Requirements */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            <CardTitle>Client Requirements</CardTitle>
                        </div>
                        <CardDescription>
                            Configure support needs, preferences, and safety requirements
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Configuration Options:</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                <li>• High-intensity support types</li>
                                <li>• Gender preferences</li>
                                <li>• Behaviour Support Plan (BSP) settings</li>
                                <li>• Manual handling requirements</li>
                                <li>• Risk level assessment</li>
                            </ul>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/dashboard/clients"
                                className="text-sm text-green-600 hover:underline"
                            >
                                Go to Clients → Select a client → Configure Requirements
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Validation Rules */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-purple-600" />
                            <CardTitle>Validation Rules</CardTitle>
                        </div>
                        <CardDescription>
                            Automated compliance checking for shift assignments
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Rule Categories:</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                <li>• <strong>Qualification Rules:</strong> Credential expiry, high-intensity matching</li>
                                <li>• <strong>SCHADS Award:</strong> Minimum shifts, breaks, overtime</li>
                                <li>• <strong>WHS Safety:</strong> Fatigue management, manual handling</li>
                                <li>• <strong>NDIS Compliance:</strong> Gender preferences, BSP requirements</li>
                                <li>• <strong>Organizational:</strong> Availability, workload distribution</li>
                            </ul>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/dashboard/rostering/shifts/new"
                                className="text-sm text-purple-600 hover:underline"
                            >
                                Create Shift → See validation in action
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Suggestions */}
                <Card className="opacity-60">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-orange-600" />
                            <CardTitle>AI Optimization</CardTitle>
                            <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
                        </div>
                        <CardDescription>
                            Gemini-powered roster suggestions and optimization
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Planned Features:</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                <li>• Intelligent worker-client matching</li>
                                <li>• Continuity of care optimization</li>
                                <li>• Travel time minimization</li>
                                <li>• Fair workload distribution</li>
                                <li>• Natural language explanations</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
