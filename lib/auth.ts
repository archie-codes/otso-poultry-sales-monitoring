import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/src/index"; // Points to db/index.ts
import { users } from "@/src/db/schema"; // Points to db/schema.ts
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      imageUrl?: string | null; // <-- Now TS knows about this!
      role: "owner" | "staff"; // <-- And this!
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email));
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (passwordsMatch) {
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            imageUrl: user.imageUrl,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    // 1. Add 'trigger' and 'session' to the parameters
    jwt: async ({ token, user, trigger, session }) => {
      // 2. Listen for the update command
      if (trigger === "update" && session) {
        token.name = session.name;
        token.imageUrl = session.imageUrl;
      }

      // 3. Keep your existing user logic
      if (user) {
        token.role = (user as any).role;
        token.imageUrl = (user as any).imageUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
        (session.user as any).imageUrl = token.imageUrl as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: "otso-poultry-farm-super-secret-key-2026", // Hardcoded for testing
};
