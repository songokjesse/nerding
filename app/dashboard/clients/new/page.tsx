import { ClientForm } from '@/components/dashboard/client-form'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { OrgRole } from '@/generated/prisma/client/enums'
import { redirect } from 'next/navigation'

export default async function NewClientPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const membership = await prisma.organisationMember.findFirst({
        where: { userId: session?.user?.id }
    })

    if (!membership || ![OrgRole.ORG_ADMIN, OrgRole.COORDINATOR].includes(membership.role)) {
        redirect('/dashboard/clients')
    }

    return (
        <div className="p-6">
            <ClientForm />
        </div>
    )
}
