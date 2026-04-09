import { auth, clerkClient } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/auth/get-user-plan";
import { authorizeProject } from "@/lib/auth/authorize-project";

const COLORS = [
  "#E57373", "#F06292", "#BA68C8", "#9575CD", "#7986CB",
  "#64B5F6", "#4FC3F7", "#4DD0E1", "#4DB6AC", "#81C784",
  "#AED581", "#FFD54F", "#FFB74D", "#FF8A65", "#A1887F",
];

function pickColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hasCollaboration } = await getUserPlan();
  if (!hasCollaboration) {
    return NextResponse.json(
      { error: "Collaboration add-on required" },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { room?: string };
  const room = body.room;
  if (!room || !room.startsWith("project:")) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }

  const projectId = room.replace("project:", "");
  const project = await authorizeProject(userId, projectId, "read");
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const name =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username ?? "Anonymous";
  const avatar = user.imageUrl ?? "";

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name,
      avatar,
      color: pickColor(userId),
    },
  });

  const canWrite = await authorizeProject(userId, projectId, "write");
  session.allow(room, canWrite ? session.FULL_ACCESS : session.READ_ACCESS);

  const { status, body: responseBody } = await session.authorize();
  return new Response(responseBody, { status });
}
