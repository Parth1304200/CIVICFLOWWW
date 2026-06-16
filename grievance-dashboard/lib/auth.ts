import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './mongodb';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        // Dynamically require User to avoid circular module issues
        const { default: User } = await import('../models/User');

        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;

        // Account lockout check
        if (user.lockUntil && user.lockUntil > new Date()) {
          throw new Error('Account temporarily locked. Try again in 15 minutes.');
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          const attempts = (user.loginAttempts ?? 0) + 1;
          const update: Record<string, unknown> = { loginAttempts: attempts };
          if (attempts >= 5) {
            update.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          await User.updateOne({ _id: user._id }, update);
          return null;
        }

        // Reset on success
        await User.updateOne(
          { _id: user._id },
          { loginAttempts: 0, lockUntil: null, lastLogin: new Date() }
        );

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
