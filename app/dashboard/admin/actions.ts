"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@/generated/prisma/client/enums"

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                image: true
            }
        })
        return { success: true, data: users }
    } catch (error) {
        return { success: false, error: "Failed to fetch users" }
    }
}

export async function updateUserRole(userId: string, role: Role) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role },
        })
        revalidatePath("/dashboard/admin")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to update role" }
    }
}

export async function createUser(prevState: any, formData: FormData) {
    try {
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const role = formData.get('role') as Role

        if (!name || !email || !role) {
            return { error: 'Missing required fields' }
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return { error: 'User with this email already exists' }
        }

        await prisma.user.create({
            data: {
                name,
                email,
                role,
                image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
            }
        })

        revalidatePath('/dashboard/admin')
        return { success: true }

    } catch (error) {
        console.error('Failed to create user:', error)
        return { error: 'Failed to create user' }
    }
}

export async function updateUser(id: string, prevState: any, formData: FormData) {
    try {
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const role = formData.get('role') as Role

        if (!name || !email || !role) {
            return { error: 'Missing required fields' }
        }

        await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role
            }
        })

        revalidatePath('/dashboard/admin')
        return { success: true }

    } catch (error) {
        console.error('Failed to update user:', error)
        return { error: 'Failed to update user' }
    }
}

export async function deleteUser(userId: string) {
    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete user:', error)
        return { error: 'Failed to delete user' }
    }
}

export async function getUser(id: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true
            }
        })
        return { user }
    } catch (error) {
        return { error: 'Failed to fetch user' }
    }
}
