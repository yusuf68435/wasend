import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitTemplateToMeta } from "@/lib/meta-templates";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const id = body?.id;
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });

  const template = await prisma.template.findFirst({
    where: { id, userId },
  });
  if (!template) {
    return NextResponse.json({ error: "Template bulunamadı" }, { status: 404 });
  }

  try {
    const { metaId } = await submitTemplateToMeta({
      name: template.name,
      language: template.language,
      category: template.category as "MARKETING" | "UTILITY" | "AUTHENTICATION",
      bodyText: template.bodyText,
    });

    const updated = await prisma.template.update({
      where: { id: template.id },
      data: { metaId, status: "PENDING", rejection: null },
    });
    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gönderim hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
