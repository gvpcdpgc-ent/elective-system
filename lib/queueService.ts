import prisma from "./prisma";
import { Redis } from "@upstash/redis";

const useRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = useRedis
    ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    : null;

const ACTIVE_TIMEOUT_SEC = 30; // Active session timeout in seconds (heartbeat expectation)

export async function hasCompletedSelection(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { selections: true }
        });

        if (!user || user.role !== "STUDENT") return false;

        // Fetch active categories matching the student's year
        const categories = await prisma.electiveCategory.findMany({
            where: {
                year: user.year || undefined,
                isActive: true
            }
        });

        if (categories.length === 0) return true; // nothing to select

        // Check if student has a selection for every active category
        const selectedCategoryIds = new Set(user.selections.map(s => s.categoryId));
        return categories.every(cat => selectedCategoryIds.has(cat.id));
    } catch (err) {
        console.error("Error checking hasCompletedSelection:", err);
        return false;
    }
}

export async function getMaxConcurrency(): Promise<number> {
    if (useRedis && redis) {
        try {
            const limit = await redis.get<number>("max_concurrency");
            if (limit !== null) return limit;
        } catch (err) {
            console.error("Redis getMaxConcurrency error:", err);
        }
    }
    try {
        const settings = await prisma.settings.findFirst();
        return settings?.maxConcurrency ?? 50;
    } catch (err) {
        console.error("Prisma getMaxConcurrency error:", err);
        return 50;
    }
}

export async function updateMaxConcurrency(limit: number): Promise<void> {
    if (useRedis && redis) {
        try {
            await redis.set("max_concurrency", limit);
        } catch (err) {
            console.error("Redis updateMaxConcurrency error:", err);
        }
    }
}

let cachedQueueEnabled: boolean | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds in-memory cache

export async function isVirtualQueueEnabled(): Promise<boolean> {
    const now = Date.now();
    if (cachedQueueEnabled !== null && (now - lastCacheTime < CACHE_TTL_MS)) {
        return cachedQueueEnabled;
    }
    try {
        const settings = await prisma.settings.findFirst();
        cachedQueueEnabled = settings?.isVirtualQueueEnabled ?? false;
        lastCacheTime = now;
        return cachedQueueEnabled;
    } catch (err) {
        console.error("Failed to query settings for virtual queue status:", err);
        return false;
    }
}

export async function getQueueStatus(userId: string): Promise<{ position: number | null; activeUsers: number }> {
    if (useRedis && redis) {
        try {
            const activeCount = await redis.zcard("active_users");
            const rank = await redis.zrank("waiting_queue", userId);
            const position = rank !== null ? rank + 1 : null;
            return { position, activeUsers: activeCount };
        } catch (err) {
            console.error("Redis queue status error, falling back to database:", err);
        }
    }

    // Prisma Fallback
    try {
        await cleanupInactive();
        const activeUsersCount = await prisma.activeUser.count();
        const waitingUser = await prisma.waitingQueue.findUnique({ where: { userId } });
        if (!waitingUser) {
            return { position: null, activeUsers: activeUsersCount };
        }
        const position = await prisma.waitingQueue.count({
            where: { joinedAt: { lt: waitingUser.joinedAt } }
        });
        return { position: position + 1, activeUsers: activeUsersCount };
    } catch (err) {
        console.error("Prisma queue status query error:", err);
        return { position: null, activeUsers: 0 };
    }
}

export async function checkAccess(userId: string): Promise<{ allowed: boolean; position: number | null }> {
    const enabled = await isVirtualQueueEnabled();
    if (!enabled) {
        return { allowed: true, position: null };
    }

    // If student has already completed selection, let them in immediately
    // without consuming any active slot in the queue!
    if (await hasCompletedSelection(userId)) {
        return { allowed: true, position: null };
    }

    const maxConcurrency = await getMaxConcurrency();

    if (useRedis && redis) {
        try {
            const now = Date.now();
            const expiredTime = now - ACTIVE_TIMEOUT_SEC * 1000;

            // 1. Clean up expired users
            await redis.zremrangebyscore("active_users", 0, expiredTime);

            // 2. Check if user is active
            const isActive = await redis.zscore("active_users", userId);
            if (isActive !== null) {
                await redis.zadd("active_users", { score: now, member: userId });
                return { allowed: true, position: null };
            }

            // 3. Count active users
            const activeCount = await redis.zcard("active_users");
            if (activeCount < maxConcurrency) {
                await redis.zadd("active_users", { score: now, member: userId });
                await redis.zrem("waiting_queue", userId);
                return { allowed: true, position: null };
            }

            // 4. Put user in queue if not already there
            let rank = await redis.zrank("waiting_queue", userId);
            if (rank === null) {
                await redis.zadd("waiting_queue", { score: now, member: userId });
                rank = await redis.zrank("waiting_queue", userId);
            }

            // 5. Recheck if slot opened and user is front of the queue
            const updatedActiveCount = await redis.zcard("active_users");
            if (updatedActiveCount < maxConcurrency && rank === 0) {
                await redis.zadd("active_users", { score: now, member: userId });
                await redis.zrem("waiting_queue", userId);
                return { allowed: true, position: null };
            }

            return { allowed: false, position: rank !== null ? rank + 1 : 1 };
        } catch (err) {
            console.error("Redis checkAccess error, falling back to database:", err);
        }
    }

    // Prisma Fallback
    try {
        await cleanupInactive();

        // 1. Check if user is active
        const activeUser = await prisma.activeUser.findUnique({ where: { userId } });
        if (activeUser) {
            await prisma.activeUser.update({
                where: { userId },
                data: { lastSeen: new Date() }
            });
            return { allowed: true, position: null };
        }

        // 2. Count active users
        const activeCount = await prisma.activeUser.count();
        if (activeCount < maxConcurrency) {
            try {
                await prisma.activeUser.upsert({
                    where: { userId },
                    update: { lastSeen: new Date() },
                    create: { userId }
                });
            } catch (err: any) {
                if (err.code !== "P2002") throw err;
            }
            await prisma.waitingQueue.deleteMany({ where: { userId } });
            return { allowed: true, position: null };
        }

        // 3. Put user in queue
        try {
            await prisma.waitingQueue.upsert({
                where: { userId },
                update: {},
                create: { userId }
            });
        } catch (err: any) {
            if (err.code !== "P2002") throw err;
        }

        // 4. Recheck if slot opened and user is front of the queue
        const firstInQueue = await prisma.waitingQueue.findFirst({
            orderBy: { joinedAt: "asc" }
        });

        if (firstInQueue?.userId === userId) {
            const recheckActiveCount = await prisma.activeUser.count();
            if (recheckActiveCount < maxConcurrency) {
                try {
                    await prisma.activeUser.upsert({
                        where: { userId },
                        update: { lastSeen: new Date() },
                        create: { userId }
                    });
                } catch (err: any) {
                    if (err.code !== "P2002") throw err;
                }
                await prisma.waitingQueue.deleteMany({ where: { userId } });
                return { allowed: true, position: null };
            }
        }

        const status = await getQueueStatus(userId);
        return { allowed: false, position: status.position };
    } catch (err) {
        console.error("Prisma checkAccess error:", err);
        return { allowed: true, position: null }; // Fail open in case of DB disaster
    }
}

export async function heartbeat(userId: string): Promise<void> {
    const enabled = await isVirtualQueueEnabled();
    if (!enabled) return;

    if (useRedis && redis) {
        try {
            const isActive = await redis.zscore("active_users", userId);
            if (isActive !== null) {
                await redis.zadd("active_users", { score: Date.now(), member: userId });
            }
            return;
        } catch (err) {
            console.error("Redis heartbeat error:", err);
        }
    }

    try {
        await prisma.activeUser.updateMany({
            where: { userId },
            data: { lastSeen: new Date() }
        });
    } catch (err) {
        console.error("Prisma heartbeat update error:", err);
    }
}

export async function cleanupInactive(): Promise<void> {
    if (useRedis && redis) {
        try {
            const expiredTime = Date.now() - ACTIVE_TIMEOUT_SEC * 1000;
            await redis.zremrangebyscore("active_users", 0, expiredTime);
            return;
        } catch (err) {
            console.error("Redis cleanup error:", err);
        }
    }

    try {
        const cutoff = new Date(Date.now() - ACTIVE_TIMEOUT_SEC * 1000);
        await prisma.activeUser.deleteMany({
            where: {
                lastSeen: { lt: cutoff }
            }
        });
    } catch (err) {
        console.error("Prisma active user cleanup error:", err);
    }
}

export async function leaveQueue(userId: string): Promise<void> {
    if (useRedis && redis) {
        try {
            await redis.zrem("active_users", userId);
            await redis.zrem("waiting_queue", userId);
            return;
        } catch (err) {
            console.error("Redis leaveQueue error:", err);
        }
    }

    try {
        await prisma.activeUser.deleteMany({ where: { userId } });
        await prisma.waitingQueue.deleteMany({ where: { userId } });
    } catch (err) {
        console.error("Prisma leaveQueue error:", err);
    }
}
