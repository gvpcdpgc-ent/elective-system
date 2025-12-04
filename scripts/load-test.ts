import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const API_URL = "http://localhost:3000/api/test/simulation";

async function main() {
    console.log("🚀 Starting Load Test...");

    // 1. Setup: Create Subject and Users
    console.log("Creating test data...");

    // Create a subject with 50 seats
    const subject = await prisma.subject.create({
        data: {
            name: "Load Test Subject",
            code: "LOAD101",
            limit: 50,
            description: "Testing concurrency",
        },
    });

    // Create 200 Users
    const users = [];
    for (let i = 0; i < 200; i++) {
        users.push({
            username: `loaduser${i}`,
            password: "password123",
            role: "STUDENT",
            branch: "CSE", // Ensure this doesn't conflict with subject branch (null)
        });
    }

    // Batch insert users (Prisma createMany is not supported for SQLite in all versions, but we'll try or loop)
    // Actually, SQLite supports createMany in recent Prisma versions.
    await prisma.user.createMany({
        data: users,
    });

    const createdUsers = await prisma.user.findMany({
        where: { username: { startsWith: "loaduser" } },
        take: 200,
    });

    console.log(`✅ Created ${createdUsers.length} users and 1 subject (Limit: 50).`);
    console.log("🔥 Firing 200 concurrent requests...");

    // 2. Fire Requests
    const startTime = Date.now();

    const promises = createdUsers.map((user) =>
        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.id,
                preferences: [subject.id],
            }),
        }).then(res => res.json())
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();

    // 3. Analyze Results
    const successCount = results.filter((r: any) => r.id).length;
    const failCount = results.filter((r: any) => r.error).length;

    console.log(`\n--- Test Results ---`);
    console.log(`Time taken: ${endTime - startTime}ms`);
    console.log(`Total Requests: ${results.length}`);
    console.log(`Successful Selections: ${successCount}`);
    console.log(`Failed Selections: ${failCount}`);

    // 4. Verify Database Integrity
    const finalSubject = await prisma.subject.findUnique({
        where: { id: subject.id },
        include: { _count: { select: { selections: true } } },
    });

    console.log(`\n--- Database Verification ---`);
    console.log(`Subject Seat Limit: ${subject.limit}`);
    console.log(`Actual Selections in DB: ${finalSubject?._count.selections}`);

    if (finalSubject?._count.selections === subject.limit) {
        console.log("✅ SUCCESS: Seat limit strictly enforced!");
    } else if (finalSubject?._count.selections! > subject.limit) {
        console.log("❌ FAILURE: Oversold! Race condition detected.");
    } else {
        console.log("⚠️  Note: Seats not fully filled (Unexpected for 200 users).");
    }

    // Cleanup
    console.log("\nCleaning up test data...");
    await prisma.selection.deleteMany({ where: { subjectId: subject.id } });
    await prisma.preference.deleteMany({ where: { subjectId: subject.id } });
    await prisma.user.deleteMany({ where: { username: { startsWith: "loaduser" } } });
    await prisma.subject.delete({ where: { id: subject.id } });
    console.log("Done.");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
