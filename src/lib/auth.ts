/**
 * NextAuth.js 인증 설정
 *
 * 이 모듈은 애플리케이션의 인증 시스템을 구성합니다.
 * GitHub, Google OAuth와 이메일/비밀번호 인증을 지원합니다.
 *
 * @module lib/auth
 *
 * @example 서버 컴포넌트에서 세션 가져오기
 * ```typescript
 * import { getServerSession } from "next-auth";
 * import { authOptions } from "@/lib/auth";
 *
 * const session = await getServerSession(authOptions);
 * if (session?.user) {
 *   console.log(session.user.id);
 * }
 * ```
 *
 * @example API Route에서 인증 확인
 * ```typescript
 * import { getServerSession } from "next-auth";
 * import { authOptions } from "@/lib/auth";
 *
 * export async function GET() {
 *   const session = await getServerSession(authOptions);
 *   if (!session) {
 *     return new Response("Unauthorized", { status: 401 });
 *   }
 *   // 인증된 요청 처리
 * }
 * ```
 *
 * @see {@link https://next-auth.js.org/configuration/options NextAuth.js 설정 문서}
 */

import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Adapter } from "next-auth/adapters";

/**
 * NextAuth.js 인증 옵션
 *
 * @property {Adapter} adapter - Prisma 어댑터 (DB 세션/계정 관리)
 * @property {Provider[]} providers - 인증 제공자 목록
 * @property {Object} pages - 커스텀 인증 페이지 경로
 * @property {Object} callbacks - JWT/세션 콜백 함수
 * @property {Object} session - 세션 전략 (JWT, 30일 만료)
 *
 * @description
 * 지원하는 인증 방식:
 * - **GitHub OAuth**: 소셜 로그인
 * - **Google OAuth**: 소셜 로그인
 * - **Credentials**: 이메일/비밀번호 (bcrypt 해싱)
 *
 * 세션 정보에 포함되는 사용자 데이터:
 * - `id`: 사용자 고유 ID
 * - `email`: 이메일 주소
 * - `name`: 표시 이름
 * - `image`: 프로필 이미지 URL
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    // GitHub OAuth Provider
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Credentials Provider for email/password login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 데이터베이스에서 사용자 조회
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        // 비밀번호 검증
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
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/login",
    error: "/auth/error",
    newUser: "/auth/signup",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          image: token.picture as string | null,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
