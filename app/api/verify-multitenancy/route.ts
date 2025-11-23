import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        console.log('Starting multitenancy verification (API)...')

        // 1. Create Organisation
        const org = await prisma.organisation.create({
            data: {
                name: 'Test Org API',
                plan: 'enterprise'
            }
        })
        console.log('Created Org:', org.id)

        // 2. Create User
        const user = await prisma.user.create({
            data: {
                name: 'Test Worker API',
                email: 'worker-api@test.com',
                role: 'EMPLOYEE'
            }
        })
        console.log('Created User:', user.id)

        // 3. Add Member
        const member = await prisma.organisationMember.create({
            data: {
                organisationId: org.id,
                userId: user.id,
                role: 'WORKER'
            }
        })
        console.log('Created Member:', member.id)

        // 4. Create Client
        const client = await prisma.client.create({
            data: {
                organisationId: org.id,
                name: 'Test Client API',
                createdById: user.id
            }
        })
        console.log('Created Client:', client.id)

        // 5. Create Shift
        const shift = await prisma.shift.create({
            data: {
                organisationId: org.id,
                clientId: client.id,
                workerId: user.id,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000), // 1 hour later
                status: 'PLANNED',
                createdById: user.id
            }
        })
        console.log('Created Shift:', shift.id)

        // 6. Create Progress Note
        const note = await prisma.progressNote.create({
            data: {
                organisationId: org.id,
                clientId: client.id,
                shiftId: shift.id,
                authorId: user.id,
                noteText: 'Shift went well (API).',
                mood: 'happy'
            }
        })
        console.log('Created Note:', note.id)

        // Cleanup
        await prisma.progressNote.delete({ where: { id: note.id } })
        await prisma.shift.delete({ where: { id: shift.id } })
        await prisma.client.delete({ where: { id: client.id } })
        await prisma.organisationMember.delete({ where: { id: member.id } })
        await prisma.user.delete({ where: { id: user.id } })
        await prisma.organisation.delete({ where: { id: org.id } })

        return NextResponse.json({ success: true, message: 'Verification Successful' })

    } catch (e: any) {
        console.error('Verification Failed:', e)
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
