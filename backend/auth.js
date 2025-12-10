import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/db.js";
import * as dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

console.log("🔐 Auth Configuration:");
console.log("   BASE_URL:", BASE_URL);
console.log("   FRONTEND_URL:", FRONTEND_URL);
console.log("   Environment:", IS_PRODUCTION ? "production" : "development");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      // ✅ Redirect to frontend after OAuth, not backend
      redirectURI: `${BASE_URL}/api/auth/callback/google`,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: [
    FRONTEND_URL,
    BASE_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://rcecod.netlify.app",
    "https://rceworkingpls.onrender.com",
  ].filter(Boolean),
  baseURL: BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  advanced: {
    // ✅ CRITICAL FIX: Use "lax" instead of "none" for OAuth state cookies
    cookieSameSite: "lax",
    cookieSecure: IS_PRODUCTION,
    useSecureCookies: IS_PRODUCTION,
    clearSessionTokenOnSignOut: true,
    crossSubdomainCookie: false,
    // ✅ Keep CSRF disabled for cross-domain
    disableCSRFCheck: IS_PRODUCTION,
    // ✅ Add default redirect after OAuth
    defaultCallbackURL: FRONTEND_URL + "/dashboard",
  },
});
