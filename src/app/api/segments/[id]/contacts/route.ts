import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRules, resolveSegmentContacts } from "@/lib/segment-resolver";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const segment = await prisma.segment.findFirst({
    where: { id, userId },
  });
  if (!segment) {
    return NextResponse.json({ error: "Segment bulunamadı" }, { status: 404 });
  }

  const ruleSet = parseRules(segment.rules);
  if (!ruleSet) {
    return NextResponse.json({ error: "Geçersiz kural seti" }, { status: 400 });
  }

  const contacts = await resolveSegmentContacts(userId, ruleSet);
  return NextResponse.json({ count: contacts.length, contacts });
}
