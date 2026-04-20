import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { templateCreateSchema } from "@/lib/validation";
import { requireUserId, isResponse } from "@/lib/api-auth";
import { withErrorHandling, ValidationError } from "@/lib/api-error";
import { prismaErrorToResponse } from "@/lib/prisma-errors";

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Geçersiz JSON");
  }
}

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const templates = await prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
});

export const POST = withErrorHandling(async (request: Request) => {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const parsed = templateCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) throw parsed.error; // ZodError → handleError → 400

  try {
    const template = await prisma.template.create({
      data: {
        ...parsed.data,
        variables: parsed.data.variables ?? null,
        userId,
      },
    });
    return NextResponse.json(template);
  } catch (error) {
    const prismaResp = prismaErrorToResponse(error, {
      uniqueMessage: "Bu isim + dil kombinasyonu zaten var",
    });
    if (prismaResp) return prismaResp;
    throw error;
  }
});

export const DELETE = withErrorHandling(async (request: Request) => {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) throw new ValidationError("ID gerekli");

  await prisma.template.deleteMany({ where: { id, userId } });
  return NextResponse.json({ success: true });
});
