import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import { getMongoClient } from "@/lib/mongo";

const client = await getMongoClient();
// Better Auth keeps its own collections (user, session, account, verification,
// jwks) inside the BookNook database — the `books` collection is untouched.
const db = client.db("BookNook");

export const auth = betterAuth({
  // Real DB-backed sessions in MongoDB — user, session and OAuth account
  // records all persist here; nothing lives in localStorage anymore.
  database: mongodbAdapter(db, { client }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    // The Register/Login pages validate "at least 6 characters", so the
    // server must accept exactly the credentials the UI allows.
    minPasswordLength: 6,
  },

  // Real Google OAuth. The client id/secret live in .env.local
  // (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Google profile data (name,
  // email, picture) is saved in the user/account collections by the adapter.
  // Empty env values only warn at startup — the button surfaces a friendly
  // error if someone clicks it before credentials are configured.
  //
  // prompt: "select_account" always shows Google's account chooser, so
  // a shared device lets the reader pick which signed-in Gmail to use
  // (even one they recently used on Google elsewhere).
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      prompt: "select_account",
    },
  },

  // An account registered with email+password can be signed into with
  // Google using the same email: link both identities onto one user record
  // instead of refusing the sign-in.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "email-password"],
    },
  },

  plugins: [
    // Mints short-lived signed JWTs at GET /api/auth/token (requires the
    // Better Auth session cookie). The separate Express backend verifies
    // these on its protected routes with jsonwebtoken. ES256 is specified
    // because Node's jsonwebtoken supports the ES family (via JWK-imported
    // public keys) but not the library default EdDSA/Ed25519.
    jwt({
      jwks: { keyPairConfig: { alg: "ES256" } },
    }),
  ],
});
