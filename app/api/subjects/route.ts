import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const subjects = await prisma.subject.findMany({
            include: {
                category: {
                    select: { name: true, year: true, semester: true }
                },
                department: {
                    select: { name: true, code: true }
                },
                _count: {
                    select: { selections: true },
                },
            },
            orderBy: { createdAt: "desc" }
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
        const { name, code, limit, description, departmentId, categoryId } = body;

        if (!name || !code || !limit || !departmentId || !categoryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch category to inherit year
        const category = await prisma.electiveCategory.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const subject = await prisma.subject.create({
            data: {
                name,
                code,
                limit: parseInt(limit),
                description,
                departmentId,
                categoryId,
                year: category.year,
            },
        });

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

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, name, code, limit, description, departmentId, categoryId } = body;

        if (!id || !name || !code || !limit || !departmentId || !categoryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch category to inherit year
        const category = await prisma.electiveCategory.findUnique({
            where: { id: categoryId }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const subject = await prisma.subject.update({
            where: { id },
            data: {
                name,
                code,
                limit: parseInt(limit),
                description,
                departmentId,
                categoryId,
                year: category.year,
            },
        });

        return NextResponse.json(subject);
    } catch (error: any) {
        console.error("Error updating subject:", error);
        return NextResponse.json({ error: `Failed to update subject: ${error.message}` }, { status: 500 });
    }
}

