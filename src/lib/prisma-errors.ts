import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Prisma known error'larını HTTP response'a çevirir.
 * P2002 = unique violation, P2025 = record not found, P2003 = FK violation.
 */
export function prismaErrorToResponse(
  error: unknown,
  opts?: { uniqueMessage?: string; notFoundMessage?: string },
): NextResponse | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;

  if (error.code === "P2002") {
    return NextResponse.json(
      { error: opts?.uniqueMessage || "Bu kayıt zaten mevcut" },
      { status: 409 },
    );
  }
  if (error.code === "P2025") {
    return NextResponse.json(
      { error: opts?.notFoundMessage || "Kayıt bulunamadı" },
      { status: 404 },
    );
  }
  if (error.code === "P2003") {
    return NextResponse.json(
      { error: "İlişkili kayıt bulunamadı" },
      { status: 400 },
    );
  }
  return null;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
