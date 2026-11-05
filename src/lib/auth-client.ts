import { createAuthClient } from "better-auth/react";

// Same-origin Better Auth client: talks to the route handlers mounted under
// /api/auth/… . Every auth action and hook (signIn.email, signUp.email,
// signIn.social, signOut, updateUser, useSession, …) hangs off this client.
export const authClient = createAuthClient();
