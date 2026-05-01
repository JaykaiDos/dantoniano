/**
 * Configuración de NextAuth v5.
 * Login simple con credenciales (email + password del .env).
 * No necesita tabla de usuarios — las credenciales viven en variables de entorno.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credenciales',
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string;
        const password = credentials?.password as string;

        // Comparar contra variables de entorno (nunca expuestas al cliente)
        if (
          email    === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: '1', name: 'Admin', email };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.isAdmin = true;
      return token;
    },
    async session({ session, token }) {
      if (token.isAdmin) session.isAdmin = true;
      return session;
    },
  },
});