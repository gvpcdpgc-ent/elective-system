import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const subjects = await prisma.subject.findMany({
            include: {
                _count: {
                    select: { selections: true },
                },
            },
        });

        const subjectsWithCount = subjects.map((subject) => ({
            ...subject,
            currentCount: subject._count.selections,
        }));

        return NextResponse.json(subjectsWithCount);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        console.log("Creating subject with body:", body);
        const { name, code, limit, description, branch } = body;

        const subject = await prisma.subject.create({
            data: {
                name,
                code,
                limit: parseInt(limit),
                description,
                branch,
                year: body.year ? parseInt(body.year) : null,
            },
        });

        console.log("Subject created:", subject);
        return NextResponse.json(subject);
    } catch (error: any) {
        console.error("Error creating subject:", error);
        return NextResponse.json({ error: `Failed to create subject: ${error.message}` }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "Subject ID required" }, { status: 400 });
        }

        await prisma.subject.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Subject deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
    }
}
