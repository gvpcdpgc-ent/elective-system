import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAccess, leaveQueue } from "@/lib/queueService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();
    let isStreamOpen = true;

    const responseStream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                if (!isStreamOpen) return;
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (e) {
                    console.error("SSE stream enqueue error:", e);
                    isStreamOpen = false;
                }
            };

            // Loop checking status every second
            while (isStreamOpen) {
                try {
                    const result = await checkAccess(userId);
                    
                    sendEvent({
                        allowed: result.allowed,
                        position: result.position
                    });

                    if (result.allowed) {
                        isStreamOpen = false;
                        try {
                            controller.close();
                        } catch (e) {}
                        break;
                    }
                } catch (error) {
                    console.error("SSE loop check access error:", error);
                    sendEvent({ error: "Check failed" });
                }

                // Sleep for 1 second
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        },
        cancel() {
            isStreamOpen = false;
            // Clean up the user from the waiting queue if they disconnect
            leaveQueue(userId).catch((err) => {
                console.error("Error in SSE cancel leaveQueue:", err);
            });
        }
    });

    return new Response(responseStream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no" // Disable buffering on Nginx proxies if any
        },
    });
}
