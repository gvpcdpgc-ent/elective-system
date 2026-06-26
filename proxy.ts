import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = useRedis
    ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null;

// In-memory sliding-window rate limiter fallback for development/local execution
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per window per user/IP

async function isRateLimited(ip: string): Promise<boolean> {
    const now = Date.now();
    const key = `ratelimit:${ip}`;

    if (useRedis && redis) {
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
            }
            return current > MAX_REQUESTS_PER_WINDOW;
        } catch (err) {
            console.error("Redis rate limiting error, falling back to memory:", err);
        }
    }

    // In-memory fallback
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS
        });
        return false;
    }

    record.count += 1;
    return record.count > MAX_REQUESTS_PER_WINDOW;
}

export default async function proxy(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const path = request.nextUrl.pathname;

    // Apply rate limiting to critical endpoints
    if (
        path.startsWith("/api/auth") ||
        path.startsWith("/api/select") ||
        path.startsWith("/api/queue") ||
        path.startsWith("/api/settings")
    ) {
        const limited = await isRateLimited(ip);
        if (limited) {
            return new NextResponse(
                JSON.stringify({ error: "Too many requests. Please try again later." }),
                {
                    status: 429,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"]
};
