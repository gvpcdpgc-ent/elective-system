import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
    const studentCount = await prisma.user.count({ where: { role: "STUDENT" } });
    const subjectCount = await prisma.subject.count();
    const selectionCount = await prisma.selection.count();

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Students</h3>
                    <p className="text-3xl font-bold mt-2">{studentCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Subjects</h3>
                    <p className="text-3xl font-bold mt-2">{subjectCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Selections</h3>
                    <p className="text-3xl font-bold mt-2">{selectionCount}</p>
                </div>
            </div>

            <div className="mt-12">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                    {/* Add quick action buttons if needed */}
                </div>
            </div>
        </div>
    );
}
