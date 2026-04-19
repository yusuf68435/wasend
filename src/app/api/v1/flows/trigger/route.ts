import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { v1FlowTriggerSchema, formatZodError } from "@/lib/validation";
import { parseGraph } from "@/lib/flow-engine";

// Kicks off a flow for a specific contact. Creates a FlowSession pointing at
// the graph's start node; the next incoming message (or immediate webhook
// tick) will advance it. For simplicity we don't run steps synchronously here.
export async function POST(request: Request) {
  const auth = await verifyApiKey(request.headers.get("authorization"));
  if (!auth) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const parsed = v1FlowTriggerSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const flow = await prisma.flow.findFirst({
    where: { id: parsed.data.flowId, userId: auth.userId, isActive: true },
  });
  if (!flow) return NextResponse.json({ error: "Akış bulunamadı" }, { status: 404 });

  const graph = parseGraph(flow.nodes);
  if (!graph) {
    return NextResponse.json({ error: "Akış grafiği geçersiz" }, { status: 400 });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, userId: auth.userId },
  });
  if (!contact) {
    return NextResponse.json({ error: "Kişi bulunamadı" }, { status: 404 });
  }
  if (contact.optedOut) {
    return NextResponse.json({ error: "Kişi opt-out" }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.flowSession.upsert({
    where: { contactId: contact.id },
    update: {
      flowId: flow.id,
      currentNodeId: graph.startId,
      state: JSON.stringify({ variables: {} }),
      expiresAt,
      userId: auth.userId,
    },
    create: {
      flowId: flow.id,
      userId: auth.userId,
      contactId: contact.id,
      currentNodeId: graph.startId,
      state: JSON.stringify({ variables: {} }),
      expiresAt,
    },
  });

  return NextResponse.json({ success: true, flowId: flow.id, contactId: contact.id });
}
