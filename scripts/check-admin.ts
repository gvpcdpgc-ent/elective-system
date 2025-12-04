import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findUnique({
        where: { username: "admin" },
    });

    if (admin) {
        console.log("✅ Admin user found:", admin);
    } else {
        console.log("❌ Admin user NOT found");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
