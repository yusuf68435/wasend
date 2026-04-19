import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, sendWhatsAppMedia, type MediaType } from "@/lib/whatsapp";
import { mergeTags } from "@/lib/autoreply-match";
import { matchesTrigger } from "@/lib/autoreply-match";

export type FlowTrigger = "keyword" | "new_contact";

export type NodeType =
  | "start"
  | "message"
  | "question"
  | "condition"
  | "action"
  | "handoff"
  | "end";

export interface FlowNode {
  id: string;
  type: NodeType;
  data: Record<string, unknown>;
  next?: string | null;
  branches?: Array<{ label: string; cond: string; value: string; next: string }>;
}

export interface FlowGraph {
  nodes: FlowNode[];
  startId: string;
}

export interface FlowSessionState {
  variables: Record<string, string>;
  lastInput?: string;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function parseGraph(raw: string | null | undefined): FlowGraph | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.nodes) || typeof p.startId !== "string") return null;
    return p as FlowGraph;
  } catch {
    return null;
  }
}

function findNode(graph: FlowGraph, id: string): FlowNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

function evalCondition(
  cond: string,
  value: string,
  input: string,
): boolean {
  const a = input.trim().toLowerCase();
  const b = value.trim().toLowerCase();
  if (cond === "equals") return a === b;
  if (cond === "contains") return a.includes(b);
  if (cond === "startsWith") return a.startsWith(b);
  if (cond === "regex") {
    try {
      return new RegExp(value, "i").test(input);
    } catch {
      return false;
    }
  }
  return false;
}

interface RunContext {
  userId: string;
  contactId: string;
  contactPhone: string;
  graph: FlowGraph;
  state: FlowSessionState;
  apiToken: string;
  phoneNumberId: string;
  flowId: string;
}

// Runs graph starting from nodeId, stopping at question/handoff/end.
// Returns the node at which execution paused, or null if ended.
async function runFrom(
  ctx: RunContext,
  startNodeId: string,
): Promise<{ pausedAt: string | null; ended: boolean }> {
  let currentId: string | null = startNodeId;
  let guard = 0;

  while (currentId && guard < 50) {
    guard++;
    const node = findNode(ctx.graph, currentId);
    if (!node) return { pausedAt: null, ended: true };

    if (node.type === "start") {
      currentId = node.next ?? null;
      continue;
    }

    if (node.type === "end") {
      return { pausedAt: null, ended: true };
    }

    if (node.type === "handoff") {
      const contact = await prisma.contact.findUnique({
        where: { id: ctx.contactId },
      });
      if (contact) {
        const merged = mergeTags(contact.tags, "needs-human");
        if (merged !== contact.tags) {
          await prisma.contact.update({
            where: { id: ctx.contactId },
            data: { tags: merged },
          });
        }
      }
      return { pausedAt: null, ended: true };
    }

    if (node.type === "message") {
      const text = String(node.data.text || "").trim();
      const mediaType = node.data.mediaType as MediaType | undefined;
      const mediaUrl = node.data.mediaUrl as string | undefined;

      try {
        const result =
          mediaType && mediaUrl
            ? await sendWhatsAppMedia({
                to: ctx.contactPhone,
                mediaType,
                mediaUrl,
                caption: text,
                phoneNumberId: ctx.phoneNumberId,
                apiToken: ctx.apiToken,
              })
            : await sendWhatsAppMessage({
                to: ctx.contactPhone,
                message: text,
                phoneNumberId: ctx.phoneNumberId,
                apiToken: ctx.apiToken,
              });
        await prisma.message.create({
          data: {
            content: text,
            direction: "outgoing",
            phone: ctx.contactPhone,
            userId: ctx.userId,
            contactId: ctx.contactId,
            status: "sent",
            waMessageId: result.waMessageId,
            mediaType: mediaType ?? null,
            mediaUrl: mediaUrl ?? null,
          },
        });
      } catch (e) {
        console.error("Flow message send failed:", e);
      }

      currentId = node.next ?? null;
      continue;
    }

    if (node.type === "question") {
      const prompt = String(node.data.prompt || "").trim();
      if (prompt) {
        try {
          const result = await sendWhatsAppMessage({
            to: ctx.contactPhone,
            message: prompt,
            phoneNumberId: ctx.phoneNumberId,
            apiToken: ctx.apiToken,
          });
          await prisma.message.create({
            data: {
              content: prompt,
              direction: "outgoing",
              phone: ctx.contactPhone,
              userId: ctx.userId,
              contactId: ctx.contactId,
              status: "sent",
              waMessageId: result.waMessageId,
            },
          });
        } catch (e) {
          console.error("Flow question send failed:", e);
        }
      }
      // Pause waiting for user input
      return { pausedAt: node.id, ended: false };
    }

    if (node.type === "condition") {
      const input = ctx.state.lastInput || "";
      let chosenNext: string | null = null;
      if (node.branches) {
        for (const b of node.branches) {
          if (evalCondition(b.cond, b.value, input)) {
            chosenNext = b.next;
            break;
          }
        }
        if (!chosenNext) chosenNext = node.next ?? null; // default/else branch
      }
      currentId = chosenNext;
      continue;
    }

    if (node.type === "action") {
      const addTags = node.data.addTags as string | undefined;
      if (addTags) {
        const contact = await prisma.contact.findUnique({
          where: { id: ctx.contactId },
        });
        if (contact) {
          const merged = mergeTags(contact.tags, addTags);
          if (merged !== contact.tags) {
            await prisma.contact.update({
              where: { id: ctx.contactId },
              data: { tags: merged },
            });
          }
        }
      }
      currentId = node.next ?? null;
      continue;
    }

    // Unknown node type
    currentId = null;
  }

  return { pausedAt: null, ended: true };
}

export interface FlowRunInput {
  userId: string;
  contactId: string;
  contactPhone: string;
  incomingText: string;
  apiToken: string;
  phoneNumberId: string;
  newContact: boolean;
}

export interface FlowRunOutcome {
  handled: boolean;
}

// Called from webhook on every incoming message. Returns handled=true if a
// flow session was advanced or a new flow was triggered.
export async function runFlows(input: FlowRunInput): Promise<FlowRunOutcome> {
  // 1. Check active session for this contact
  const session = await prisma.flowSession.findUnique({
    where: { contactId: input.contactId },
    include: { flow: true },
  });

  const now = new Date();
  if (session && session.expiresAt > now) {
    const graph = parseGraph(session.flow.nodes);
    if (!graph) {
      await prisma.flowSession.delete({ where: { id: session.id } });
      return { handled: false };
    }

    const state: FlowSessionState = tryParseState(session.state);
    state.lastInput = input.incomingText;
    // Advance from current node (which must be a question awaiting input).
    // Question nodes advance to their `next` on input.
    const node = findNode(graph, session.currentNodeId);
    const nextId =
      node?.type === "question" ? node.next ?? null : session.currentNodeId;

    if (!nextId) {
      await prisma.flowSession.delete({ where: { id: session.id } });
      return { handled: true };
    }

    // Store user input as a variable if question defined a varName
    if (node?.type === "question") {
      const varName = String(node.data.varName || "").trim();
      if (varName) state.variables[varName] = input.incomingText;
    }

    const ctx: RunContext = {
      userId: input.userId,
      contactId: input.contactId,
      contactPhone: input.contactPhone,
      graph,
      state,
      apiToken: input.apiToken,
      phoneNumberId: input.phoneNumberId,
      flowId: session.flowId,
    };

    const result = await runFrom(ctx, nextId);

    if (result.ended || !result.pausedAt) {
      await prisma.flowSession.delete({ where: { id: session.id } });
    } else {
      await prisma.flowSession.update({
        where: { id: session.id },
        data: {
          currentNodeId: result.pausedAt,
          state: JSON.stringify(state),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });
    }
    return { handled: true };
  }

  // Expired session cleanup
  if (session && session.expiresAt <= now) {
    await prisma.flowSession.delete({ where: { id: session.id } });
  }

  // 2. Find matching trigger
  const flows = await prisma.flow.findMany({
    where: { userId: input.userId, isActive: true },
  });

  for (const f of flows) {
    let trigger = false;
    if (f.trigger === "new_contact" && input.newContact) trigger = true;
    else if (f.trigger === "keyword" && f.triggerValue) {
      trigger = matchesTrigger(input.incomingText, f.triggerValue, "contains");
    }

    if (!trigger) continue;

    const graph = parseGraph(f.nodes);
    if (!graph) continue;

    const state: FlowSessionState = {
      variables: {},
      lastInput: input.incomingText,
    };

    const ctx: RunContext = {
      userId: input.userId,
      contactId: input.contactId,
      contactPhone: input.contactPhone,
      graph,
      state,
      apiToken: input.apiToken,
      phoneNumberId: input.phoneNumberId,
      flowId: f.id,
    };

    const result = await runFrom(ctx, graph.startId);

    if (!result.ended && result.pausedAt) {
      await prisma.flowSession.create({
        data: {
          flowId: f.id,
          userId: input.userId,
          contactId: input.contactId,
          currentNodeId: result.pausedAt,
          state: JSON.stringify(state),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });
    }
    return { handled: true };
  }

  return { handled: false };
}

function tryParseState(raw: string): FlowSessionState {
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") {
      return {
        variables: p.variables || {},
        lastInput: p.lastInput,
      };
    }
  } catch {
    // fallthrough
  }
  return { variables: {} };
}
