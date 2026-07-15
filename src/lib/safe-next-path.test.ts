import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNextPath("/admin/tenants?status=active#list")).toBe(
      "/admin/tenants?status=active#list",
    );
  });

  it.each([
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example/steal",
    "%2F%2Fevil.example%2Fsteal",
    "/%5Cevil.example/steal",
    "%",
  ])("rejects unsafe redirect %s", (value) => {
    expect(safeNextPath(value, "/admin")).toBe("/admin");
  });

  it("uses a safe default when the requested path or fallback is invalid", () => {
    expect(safeNextPath(null, "//evil.example")).toBe("/dashboard");
  });
});
