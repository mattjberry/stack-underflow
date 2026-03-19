import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const result = await pool.query(
          `SELECT * FROM users WHERE display_name = $1`,
          [credentials.username]
        );

        const user = result.rows[0];
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!passwordMatch) return null;

        // Return object becomes available as session.user
        return {
          id: user.id.toString(),
          name: user.display_name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Runs when JWT is created — persist extra fields into the token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    // Runs when session is accessed — expose token fields to session.user
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",   // redirect here instead of NextAuth's default login page
  },
  session: {
    strategy: "jwt",
  },
});