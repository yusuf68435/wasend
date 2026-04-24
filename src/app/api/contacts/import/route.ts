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

  // 1. Tüm satırları valide et — geçerli olanları map'e koy (phone key, son
  //    gelen kazanır). Geçersiz satırlar rowErrors'a düşer.
  const validRows = new Map<
    string,
    {
      name: string;
      phone: string;
      tags?: string | null;
      notes?: string | null;
      language?: string | null;
      source?: string | null;
    }
  >();

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
    validRows.set(validated.data.phone, validated.data);
  }

  const allPhones = Array.from(validRows.keys());

  // 2. Mevcut kontakları batch halinde çek — 10K satır serisel findUnique
  //    yerine tek IN sorgusu (500'lük chunk'larla PG parameter limitini aş-
  //    mamak için).
  const LOOKUP_BATCH = 500;
  const existingByPhone = new Map<
    string,
    { id: string; tags: string | null; notes: string | null; language: string; source: string | null }
  >();
  for (let i = 0; i < allPhones.length; i += LOOKUP_BATCH) {
    const slice = allPhones.slice(i, i + LOOKUP_BATCH);
    const rows = await prisma.contact.findMany({
      where: { userId, phone: { in: slice } },
      select: {
        id: true,
        phone: true,
        tags: true,
        notes: true,
        language: true,
        source: true,
      },
    });
    for (const r of rows) existingByPhone.set(r.phone, r);
  }

  // 3. Yeni kontakları topla, mevcutları update listesine ayır.
  const toInsert: Array<{
    name: string;
    phone: string;
    tags: string | null;
    notes: string | null;
    language: string;
    source: string;
    userId: string;
  }> = [];
  const toUpdate: Array<{
    id: string;
    name: string;
    tags: string | null;
    notes: string | null;
    language: string;
    source: string | null;
  }> = [];

  for (const [phone, data] of validRows) {
    const existing = existingByPhone.get(phone);
    if (existing) {
      if (mode === "update") {
        toUpdate.push({
          id: existing.id,
          name: data.name,
          tags: data.tags ?? existing.tags,
          notes: data.notes ?? existing.notes,
          language: data.language ?? existing.language,
          source: data.source ?? existing.source,
        });
      } else {
        skipped++;
      }
    } else {
      toInsert.push({
        name: data.name,
        phone: data.phone,
        tags: data.tags ?? null,
        notes: data.notes ?? null,
        language: data.language ?? "tr",
        source: data.source ?? "csv-import",
        userId,
      });
    }
  }

  // 4. Batch insert (createMany, 500'lük chunk). SQLite + Prisma'da
  //    skipDuplicates yok — zaten existingByPhone ile önceden filtreledik,
  //    yarışmacı aynı zamanda aynı phone'u insert etse bile userId_phone
  //    unique constraint bir tarafı reject eder; batch catch'e düşer.
  const INSERT_BATCH = 500;
  for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
    const slice = toInsert.slice(i, i + INSERT_BATCH);
    try {
      const res = await prisma.contact.createMany({ data: slice });
      inserted += res.count;
    } catch (e) {
      // Race'de duplicate çıkarsa batch geri düşer — satır satır dene
      const code = (e as { code?: string })?.code;
      if (code !== "P2002") throw e;
      for (const row of slice) {
        try {
          await prisma.contact.create({ data: row });
          inserted++;
        } catch (inner) {
          const ic = (inner as { code?: string })?.code;
          if (ic !== "P2002") throw inner;
          skipped++;
        }
      }
    }
  }

  // 5. Update'ler — her satır farklı data, createMany uygulanamaz. Transaction
  //    ile batch'le, 500'lük chunk.
  const UPDATE_BATCH = 500;
  for (let i = 0; i < toUpdate.length; i += UPDATE_BATCH) {
    const slice = toUpdate.slice(i, i + UPDATE_BATCH);
    await prisma.$transaction(
      slice.map((u) =>
        prisma.contact.update({
          where: { id: u.id },
          data: {
            name: u.name,
            tags: u.tags,
            notes: u.notes,
            language: u.language,
            source: u.source,
          },
        }),
      ),
    );
    updated += slice.length;
  }

  return NextResponse.json({
    inserted,
    updated,
    skipped,
    total: parsed.data.length,
    errors: rowErrors.slice(0, 20),
  });
}
