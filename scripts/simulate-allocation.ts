import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const API_URL = "http://localhost:3000/api/test/simulation";

async function main() {
    console.log("🚀 Starting Allocation Simulation...");

    // 1. Fetch Data
    const subjects = await prisma.subject.findMany({
        include: { department: true }
    });
    const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        include: { department: true }
    });

    console.log(`Loaded ${students.length} students and ${subjects.length} subjects.`);

    // Map subjects by department code for easy lookup
    const subjectMap = subjects.reduce((acc, sub) => {
        if (sub.department?.code) acc[sub.department.code] = sub;
        return acc;
    }, {} as Record<string, typeof subjects[0]>);

    // 2. Simulate Selections
    // Logic: Each student tries to select a subject NOT from their own department (Open Elective).
    // We will randomly pick one of the valid subjects for each student.

    const BATCH_SIZE = 5;
    const results: any[] = [];

    console.log(`🔥 Firing requests in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
        const batchStudents = students.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1} / ${Math.ceil(students.length / BATCH_SIZE)}...`);

        const batchPromises = batchStudents.map(student => {
            // Filter out own department subject
            const validSubjects = subjects.filter(s => s.departmentId !== student.departmentId);

            if (validSubjects.length === 0) {
                return Promise.resolve({ error: "No valid subjects available", studentId: student.id, branch: student.department?.code });
            }

            // Randomly pick one valid subject
            const targetSubject = validSubjects[Math.floor(Math.random() * validSubjects.length)];

            return fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: student.id,
                    preferences: [targetSubject.id],
                }),
            })
                .then(res => res.json())
                .then(data => ({ ...data, studentId: student.id, branch: student.department?.code, targetSubject: targetSubject.name }));
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }

    // 3. Analyze Results
    let success = 0;
    let failed = 0;
    const failuresByBranch: Record<string, number> = {};
    const errorMessages = new Set<string>();

    results.forEach((r: any) => {
        if (r.id) {
            success++;
        } else {
            failed++;
            const branch = r.branch || "Unknown";
            failuresByBranch[branch] = (failuresByBranch[branch] || 0) + 1;
            if (r.error) errorMessages.add(r.error);
        }
    });

    console.log(`\n--- Simulation Results ---`);
    console.log(`Total Requests: ${results.length}`);
    console.log(`Successful: ${success}`);
    console.log(`Failed: ${failed}`);

    console.log("\nError Messages Encountered:");
    errorMessages.forEach(msg => console.log(`- ${msg}`));

    console.log("\nFailures by Department Code:");
    console.table(failuresByBranch);

    // 4. Verify Database Counts
    console.log(`\n--- Database Verification ---`);
    const finalSubjects = await prisma.subject.findMany({
        include: { 
            department: true,
            _count: { select: { selections: true } } 
        },
    });

    finalSubjects.forEach(sub => {
        const status = sub._count.selections === sub.limit ? "FULL" : "OPEN";
        console.log(`${sub.name} (${sub.department?.code || 'N/A'}): ${sub._count.selections} / ${sub.limit} [${status}]`);
    });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
