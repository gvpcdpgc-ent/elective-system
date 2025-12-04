import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SelectionComponent from "./SelectionComponent";

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions);

    if (!session) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { selection: { include: { subject: true } } },
    });

    if (!user) return <div>User not found</div>;

    const whereClause: any = {};
    if (user.year) {
        whereClause.year = user.year;
    }

    const subjects = await prisma.subject.findMany({
        where: whereClause,
        include: {
            _count: {
                select: { selections: true },
            },
        },
    });

    const subjectsWithCount = subjects.map((subject: any) => ({
        ...subject,
        currentCount: subject._count.selections,
    }));

    const settings = await prisma.settings.findFirst();

    const isDeadlinePassed = settings?.deadline ? new Date() > settings.deadline : false;

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.username}</h2>
                <div className="text-gray-600">
                    {user?.branch && <span>Branch: {user.branch}</span>}
                    {user?.year && <span className="ml-4">Year: {user.year}</span>}
                </div>
                {settings?.deadline && (
                    <div className="mt-2 text-sm font-medium text-orange-600">
                        Deadline: {settings.deadline.toISOString().split('T')[0]}
                    </div>
                )}
            </div>

            {user?.selection ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-green-900">Selection Confirmed</h3>
                    <p className="mt-2 text-green-700">
                        You have selected: <strong>{user.selection.subject.name}</strong> ({user.selection.subject.code})
                    </p>
                </div>
            ) : (
                <SelectionComponent
                    subjects={subjectsWithCount}
                    userBranch={user.branch}
                    isDeadlinePassed={isDeadlinePassed}
                />
            )}
        </div>
    );
}
