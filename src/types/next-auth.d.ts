import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    isAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isAdmin?: boolean;
  }
}
