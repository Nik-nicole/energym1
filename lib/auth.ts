import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { withPrismaQuery } from './prisma-middleware';
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await withPrismaQuery(async () => {
            return await prisma.user.findUnique({
              where: { email: credentials.email },
              include: { sede: true },
            });
          });

          if (!user) {
            return null;
          }

          // Verificar si el usuario está activo
          if (!user.isActive) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName || ''}`,
            role: user.role,
            sedeId: user.sedeId,
            sedeName: user?.sede?.nombre ?? null,
          };
        } catch (error) {
          console.error("Error en autenticación:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sedeId = user.sedeId;
        token.sedeName = user.sedeName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.sedeId = token.sedeId;
        session.user.sedeName = token.sedeName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 7 * 24 * 60 * 60, // Actualizar cada 7 días (reduce llamadas a session)
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
