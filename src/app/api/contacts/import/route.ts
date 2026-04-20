import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Papa from "papaparse";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactImportRowSchema } from "@/lib/validation";

export const maxDuration = 60;

const MAX_CSV_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_CSV_ROWS = 10_000;

interface ImportRow {
  name?: string;
  phone?: string;
  tags?: string;
  notes?: string;
  language?: string;
  source?: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Content-Length kontrolü (erken reject)
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_CSV_BYTES) {
    return NextResponse.json(
      { error: `CSV çok büyük (max ${MAX_CSV_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "update" ? "update" : "skip";

  const csv = await request.text();
  if (!csv.trim()) {
    return NextResponse.json({ error: "CSV boş" }, { status: 400 });
  }
  // Header'ı spoof eden client için post-read safety check
  if (csv.length > MAX_CSV_BYTES) {
    return NextResponse.json(
      { error: "CSV çok büyük" },
      { status: 413 },
    );
  }

  const parsed = Papa.parse<ImportRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      {
        error: "CSV ayrıştırma hatası",
        issues: parsed.errors.slice(0, 5).map((e) => e.message),
      },
      { status: 400 },
    );
  }

  if (parsed.data.length > MAX_CSV_ROWS) {
    return NextResponse.json(
      {
        error: `Max ${MAX_CSV_ROWS} satır destekleniyor (${parsed.data.length} satır geldi)`,
      },
      { status: 400 },
    );
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const rowErrors: Array<{ row: number; message: string }> = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const candidate = {
      name: row.name?.trim(),
      phone: row.phone?.trim(),
      tags: row.tags?.trim() || null,
      notes: row.notes?.trim() || null,
      language: row.language?.trim() || null,
      source: row.source?.trim() || "csv-import",
    };

    const validated = contactImportRowSchema.safeParse(candidate);
    if (!validated.success) {
      rowErrors.push({
        row: i + 2,
        message: validated.error.issues[0]?.message || "Geçersiz",
      });
      continue;
    }

    const data = validated.data;
    const existing = await prisma.contact.findUnique({
      where: { userId_phone: { userId, phone: data.phone } },
    });

    if (existing) {
      if (mode === "update") {
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            tags: data.tags ?? existing.tags,
            notes: data.notes ?? existing.notes,
            language: data.language ?? existing.language,
            source: data.source ?? existing.source,
          },
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      await prisma.contact.create({
        data: {
          name: data.name,
          phone: data.phone,
          tags: data.tags ?? null,
          notes: data.notes ?? null,
          language: data.language ?? "tr",
          source: data.source ?? "csv-import",
          userId,
        },
      });
      inserted++;
    }
  }

  return NextResponse.json({
    inserted,
    updated,
    skipped,
    total: parsed.data.length,
    errors: rowErrors.slice(0, 20),
  });
}
