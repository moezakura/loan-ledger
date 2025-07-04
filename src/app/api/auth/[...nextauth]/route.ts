import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile) {
        // Map Discord profile to our User model
        // https://next-auth.js.org/providers/discord#options
        // Ensure you have the correct scopes (e.g., 'identify', 'email') in your Discord app settings
        return {
          id: profile.id, // This will be used by PrismaAdapter to link to Account.providerAccountId
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
          discordId: profile.id, // Custom field
          username: profile.username, // Custom field
          displayName: profile.global_name, // Custom field
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).discordId = (user as any).discordId; // Make discordId available in session
        (session.user as any).username = (user as any).username; // Make username available in session
        (session.user as any).displayName = (user as any).displayName; // Make displayName available in session
      }
      return session;
    },
  },
  pages: {
    // signIn: '/auth/signin', // If you have a custom sign-in page
    // error: '/auth/error', // Error code passed in query string as ?error=
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
