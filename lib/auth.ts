import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  // Credentials provider requires JWT sessions (no DB session row for
  // password logins), so we use JWT strategy for everyone; the Prisma
  // adapter still persists OAuth accounts/users.
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/signup',
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // On initial login, find the first membership to set as default activeOrgId/activeOrgName
        const firstMembership = await prisma.membership.findFirst({
          where: { userId: user.id },
          include: { organization: true },
          orderBy: { createdAt: 'asc' },
        });
        if (firstMembership) {
          token.activeOrgId = firstMembership.organizationId;
          token.activeOrgName = firstMembership.organization.name;
        }
      }

      if (trigger === 'update' && session?.activeOrgId) {
        // Verify the user is actually a member of this organization
        const membership = await prisma.membership.findFirst({
          where: {
            userId: token.id,
            organizationId: session.activeOrgId,
          },
          include: { organization: true },
        });

        if (membership) {
          token.activeOrgId = session.activeOrgId;
          token.activeOrgName = membership.organization.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.activeOrgId = token.activeOrgId;
        session.activeOrgName = token.activeOrgName;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
