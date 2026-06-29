import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SelectionComponent from "./SelectionComponent";

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions);

    if (!session) return null;

    const settings = await prisma.settings.findFirst();
    const isCseCsmRestrictionEnabled = settings?.isCseCsmRestrictionEnabled || false;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            selections: { include: { subject: true } },
            department: true,
        },
    });

    if (!user) return <div>User not found</div>;

    // Fetch active categories that match the student's current year of study
    const categories = await prisma.electiveCategory.findMany({
        where: {
            year: user.year || undefined,
            isActive: true
        },
        include: {
            selectionWindow: true,
            subjects: {
                include: {
                    department: true,
                    _count: {
                        select: { selections: true },
                    },
                },
            },
        },
    });

    const isDeadlinePassed = false; // handled per-category inside SelectionComponent

    // Map each category to check if student has selected a subject for it
    const categoriesWithState = categories.map((cat) => {
        const confirmedSelection = user.selections.find(s => s.categoryId === cat.id);

        const subjectsWithCount = cat.subjects.map((sub) => ({
            id: sub.id,
            name: sub.name,
            code: sub.code,
            limit: sub.limit,
            description: sub.description,
            currentCount: sub._count.selections,
            branch: sub.department?.code || null
        }));

        const now = new Date();
        let windowState: "NONE" | "SCHEDULED" | "ACTIVE" | "CLOSED" = "NONE";
        if (cat.selectionWindow) {
            const start = cat.selectionWindow.startTime;
            const end = cat.selectionWindow.endTime;
            if (now < start) windowState = "SCHEDULED";
            else if (now > end) windowState = "CLOSED";
            else windowState = "ACTIVE";
        }

        return {
            id: cat.id,
            name: cat.name,
            year: cat.year,
            semester: cat.semester,
            startTime: cat.selectionWindow?.startTime ? cat.selectionWindow.startTime.toISOString() : null,
            endTime: cat.selectionWindow?.endTime ? cat.selectionWindow.endTime.toISOString() : null,
            windowState,
            confirmedSelection,
            subjects: subjectsWithCount,
        };
    });

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}</h2>
                <div className="text-gray-600">
                    {user?.department && <span>Department: {user.department.name}</span>}
                    {user?.year && <span className="ml-4">Year: {user.year}</span>}
                </div>
            </div>

            <div className="space-y-12">
                {categoriesWithState.map((cat) => (
                    <div key={cat.id} className="border-t pt-8 first:border-t-0 first:pt-0">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {cat.name} ({cat.year} Year / {cat.semester} Semester)
                        </h3>

                        {cat.confirmedSelection ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-xl">
                                <h4 className="text-lg font-medium text-green-900 font-semibold">Selection Confirmed</h4>
                                <p className="mt-2 text-green-700">
                                    You have selected: <strong>{cat.confirmedSelection.subject.name}</strong> ({cat.confirmedSelection.subject.code})
                                </p>
                            </div>
                        ) : (
                            <SelectionComponent
                                subjects={cat.subjects}
                                categoryId={cat.id}
                                userBranch={user.department?.code || null}
                                isDeadlinePassed={cat.endTime ? new Date() > new Date(cat.endTime) : false}
                                startTime={cat.startTime}
                                endTime={cat.endTime}
                                windowState={cat.windowState}
                                isCseCsmRestrictionEnabled={isCseCsmRestrictionEnabled}
                            />
                        )}
                    </div>
                ))}
                {categoriesWithState.length === 0 && (
                    <div className="text-gray-500">No active elective categories found for your year of study.</div>
                )}
            </div>
        </div>
    );
}
