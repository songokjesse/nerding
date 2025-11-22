import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Attempting to create user with role string...')
        // Simulate what better-auth might do if it passes the value
        const user1 = await prisma.user.create({
            data: {
                name: 'Test Repro 1',
                email: 'test-repro-1@example.com',
                id: 'test-repro-1',
                role: 'VIEWER' as any // Force cast to check if string works (it should match enum)
            }
        })
        console.log('Success user1:', user1)

        console.log('Attempting to create user without role (relying on default)...')
        const user2 = await prisma.user.create({
            data: {
                name: 'Test Repro 2',
                email: 'test-repro-2@example.com',
                id: 'test-repro-2',
                // role is undefined
            }
        })
        console.log('Success user2:', user2)

        // Cleanup
        await prisma.user.deleteMany({
            where: {
                id: { in: ['test-repro-1', 'test-repro-2'] }
            }
        })

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
