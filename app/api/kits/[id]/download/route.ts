import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getKit, kitMarkdown, kitSkillViews } from "@/lib/kits";

// The kit's setup file. Only the account that owns the kit can download it.
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "sign in to download your kit" }, { status: 401 });

  const kit = getKit(id);
  if (!kit) return NextResponse.json({ error: "unknown kit" }, { status: 404 });
  const claim = await db.kitClaim.findUnique({ where: { operatorId_kitId: { operatorId: session.user.id, kitId: kit.id } } });
  if (!claim) return NextResponse.json({ error: "you don't have this kit yet" }, { status: 403 });

  const body = kitMarkdown(kit, await kitSkillViews(kit));
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="noden-${kit.id}-kit.md"`,
      "Cache-Control": "private, no-store",
    },
  });
}
