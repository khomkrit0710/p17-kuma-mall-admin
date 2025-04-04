import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { DefaultSession } from "next-auth"

const prisma = new PrismaClient()

declare module "next-auth" {
    interface Session {
      user?: {
        id?: string;
        role?: string;
      } & DefaultSession["user"]
    }
    
    interface User {
      role?: string;
    }
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
            email: { label: 'Email', type: 'email', placeholder: 'john@doe.com' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials) return null
              
          console.log("Login attempt with:", credentials.email);
          
          const user = await prisma.accountAdmin.findUnique({
              where: { email: credentials.email },
          })
          
          if (!user) {
              console.log("No user found with this email");
              return null;
          }
          
          console.log("User found:", user.email);
          
          try {
              const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
              console.log("Password valid:", isPasswordValid);
              
              if (isPasswordValid) {
                  return {
                      id: user.id,
                      name: user.name || "",
                      email: user.email,
                      role: user.role
                  }
              } else {
                  console.log("Invalid password");
                  return null;
              }
          } catch (error) {
              console.error("Error comparing passwords:", error);
              return null;
          }
      }
    })
    ],
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt' as const,
    },
    callbacks: {
        jwt: async ({ token, user }) => {
        if (user) {
            token.id = user.id
            token.role = user.role
        }
        return token
        },
        session: async ({ session, token }) => {
            if (session.user) {
            session.user.id = token.id as string
            session.user.role = token.role as string
        }
        return session
        }
    },
}

