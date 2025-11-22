import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    baseURL: "http://localhost:3000" // Make sure base URL is set if needed, or rely on default
})
export const { signIn, signUp, signOut, useSession } = authClient