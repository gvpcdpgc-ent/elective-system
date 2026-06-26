import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import StudentLayoutClient from "./StudentLayoutClient";
import { checkAccess } from "@/lib/queueService";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        redirect("/login");
    }

    // Check Virtual Waiting Room Concurrency Access
    const access = await checkAccess(session.user.id);
    if (!access.allowed) {
        redirect("/waiting-room");
    }

    return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
