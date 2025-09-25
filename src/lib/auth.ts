import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Get project identifier from environment
const PROJECT_ID = process.env.PROJECT_ID || "document-parser";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Credentials : ", credentials);
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            project: PROJECT_ID,
          },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        const isUserVerified = user?.isVerified;

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        if (!isUserVerified) {
          throw new Error("User is not verified !");
        }

        return {
          id: user.userId.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            `${user.firstName} ${user.lastName}`
          )}&background=random`,
          role: user.role || undefined,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
    signOut: "/landing",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === "github") {
        const existingUser = await prisma.user.findUnique({
          where: {
            email_project: {
              email: user.email!,
              project: PROJECT_ID,
            },
          },
        });

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              firstName: user.name?.split(" ")[0] || "",
              lastName: user.name?.split(" ")[1] || "",
              role: "U",
              project: PROJECT_ID,
              passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
              updatedAt: new Date(),
            },
          });
          (user as any).id = newUser.userId.toString();
        } else {
          (user as any).id = existingUser.userId.toString();
        }
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token as any).id;
        session.user.role = (token as any).role;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any)?.role;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};
