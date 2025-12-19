import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      officeId: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    officeId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    officeId: string | null;
  }
}
