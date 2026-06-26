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

        let dept = await prisma.department.findUnique({
            where: { code: "CSE" }
        });

        if (!dept) {
            dept = await prisma.department.create({
                data: {
                    name: "COMPUTER SCIENCE AND ENGINEERING",
                    code: "CSE"
                }
            });
        }

        await prisma.user.create({
            data: {
                username: "student",
                password: hashedPassword,
                role: "STUDENT",
                departmentId: dept.id,
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
