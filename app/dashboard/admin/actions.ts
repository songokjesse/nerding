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
