import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const subject = await prisma.subject.findFirst({
        where: { code: "LOAD101" },
        include: { _count: { select: { selections: true } } },
    });

    if (subject) {
        console.log(`Subject: ${subject.name}`);
        console.log(`Limit: ${subject.limit}`);
        console.log(`Selections: ${subject._count.selections}`);
    } else {
        console.log("Test subject not found.");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
