import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prismaErrorToResponse } from "@/lib/prisma-errors";
import { formatZodError } from "@/lib/validation";

/**
 * Structured application error. HTTP status + user-facing error kodu taşır.
 * Throw edildiğinde handleError() tarafından yakalanır.
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code: string = "INTERNAL",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Yetkisiz") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Erişim reddedildi") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Bulunamadı") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Doğrulama hatası") {
    super(message, 400, "VALIDATION");
  }
}

export class QuotaExceededError extends AppError {
  constructor(
    message: string,
    public limit?: number,
    public used?: number,
  ) {
    super(message, 402, "QUOTA_EXCEEDED");
  }
}

/**
 * Herhangi bir hatayı NextResponse'a çevirir:
 * - AppError → status + code + message
 * - ZodError → 400 + structured issues
 * - Prisma P2002/P2025/P2003 → semantic response
 * - Diğer → 500 generic (sensitive bilgi sızdırılmaz)
 */
export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const body: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    };
    if (error instanceof QuotaExceededError) {
      if (error.limit !== undefined) body.limit = error.limit;
      if (error.used !== undefined) body.used = error.used;
    }
    return NextResponse.json(body, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(formatZodError(error), { status: 400 });
  }

  const prismaResp = prismaErrorToResponse(error);
  if (prismaResp) return prismaResp;

  // Beklenmedik hata — logla, kullanıcıya generic mesaj
  console.error("API unhandled error:", error);
  return NextResponse.json(
    { error: "Sunucu hatası, lütfen daha sonra tekrar deneyin." },
    { status: 500 },
  );
}

/**
 * API route handler sarmalayıcısı. try/catch boilerplate'i kaldırır.
 *
 * Kullanım:
 *   export const POST = withErrorHandling(async (req) => {
 *     const userId = await requireUserId();
 *     if (isResponse(userId)) return userId;
 *     // ... business logic, throw AppError vs
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
