import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const existingStudent = await prisma.user.findUnique({
        where: { username: "student" },
    });

    if (!existingStudent) {
        console.log("Creating 'student' user...");
        const hashedPassword = await bcrypt.hash("password123", 10);

        await prisma.user.create({
            data: {
                username: "student",
                password: hashedPassword,
                role: "STUDENT",
                branch: "CSE",
            },
        });
        console.log("✅ Created student user: student / password123");
    } else {
        console.log("✅ 'student' user already exists.");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
