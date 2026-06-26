import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function writeAuthLog(username: string, event: string, role?: string | null) {
    try {
        await prisma.authLog.create({
            data: { username, event, role: role ?? null },
        });
    } catch (err) {
        // Never let logging failure break the auth flow
        console.error("AuthLog write error:", err);
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username },
                });

                if (!user) {
                    await writeAuthLog(credentials.username, "USER_NOT_FOUND", null);
                    return null;
                }

                if (user.role === "STUDENT") {
                    const settings = await prisma.settings.findFirst();
                    if (settings && !settings.isStudentLoginEnabled) {
                        await writeAuthLog(credentials.username, "LOGIN_DISABLED", "STUDENT");
                        throw new Error("Student login is currently disabled");
                    }
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    await writeAuthLog(credentials.username, "WRONG_PASSWORD", user.role);
                    return null;
                }

                await writeAuthLog(credentials.username, "SUCCESS", user.role);

                return {
                    id: user.id,
                    name: user.username,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};
