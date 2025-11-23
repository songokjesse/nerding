import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    // baseURL: "http://localhost:3000" // Removed to use relative path / current origin
})
export const { signIn, signUp, signOut, useSession } = authClient