import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting seeding...");

    // 1. Clean up existing data
    await prisma.selection.deleteMany();
    await prisma.preference.deleteMany();
    await prisma.user.deleteMany();
    await prisma.subject.deleteMany();

    console.log("🧹 Cleared existing data.");

    // 2. Create Admin
    const password = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            username: 'admin',
            password,
            role: 'ADMIN',
        },
    });
    console.log("👤 Created Admin user.");

    // 3. Create Subjects
    const subjectsData = [
        { name: "Advanced CSE", code: "CSE401", limit: 140, branch: "CSE" },
        { name: "Advanced CSM", code: "CSM401", limit: 70, branch: "CSM" },
        { name: "Advanced ECE", code: "ECE401", limit: 120, branch: "ECE" },
        { name: "Advanced Civil", code: "CIV401", limit: 70, branch: "CIVIL" },
        { name: "Advanced Mech", code: "MEC401", limit: 70, branch: "MECHANICAL" },
    ];

    for (const s of subjectsData) {
        // Assign random year 1-4
        const randomYear = Math.floor(Math.random() * 4) + 1;
        await prisma.subject.create({
            data: {
                ...s,
                year: randomYear
            }
        });
    }
    console.log("📚 Created Subjects with random years.");

    // 4. Create Students
    const studentCounts = {
        CSE: 200,
        CSM: 70,
        ECE: 130,
        CIVIL: 60,
        MECHANICAL: 60,
    };

    const studentPassword = await bcrypt.hash('password123', 10);
    const students = [];

    for (const [branch, count] of Object.entries(studentCounts)) {
        for (let i = 1; i <= count; i++) {
            const randomYear = Math.floor(Math.random() * 4) + 1;
            students.push({
                username: `${branch.toLowerCase()}_student_${i}`,
                password: studentPassword,
                role: "STUDENT",
                branch: branch,
                year: randomYear,
            });
        }
    }

    // Batch insert students
    // Note: SQLite supports createMany in recent versions, but if it fails we might need a loop.
    // Assuming standard Prisma setup which supports it.
    await prisma.user.createMany({
        data: students,
    });

    console.log(`🎓 Created ${students.length} students across all branches.`);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
