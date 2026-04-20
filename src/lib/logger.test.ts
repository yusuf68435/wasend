import { describe, it, expect } from "vitest";
import { maskPhone, maskEmail } from "./logger";

describe("maskPhone", () => {
  it("uzun numarayı maskeler", () => {
    expect(maskPhone("+905551234567")).toBe("+9055****567");
  });

  it("kısa numarada *** döner", () => {
    expect(maskPhone("123")).toBe("***");
  });

  it("null/boş → boş string", () => {
    expect(maskPhone(null)).toBe("");
    expect(maskPhone(undefined)).toBe("");
    expect(maskPhone("")).toBe("");
  });
});

describe("maskEmail", () => {
  it("local-part'ı maskeler, domain korur", () => {
    expect(maskEmail("yusuf@wasend.tech")).toBe("y***@wasend.tech");
    expect(maskEmail("a@b.co")).toBe("a***@b.co");
  });

  it("@'siz input → ***", () => {
    expect(maskEmail("notanemail")).toBe("***");
  });

  it("null/boş güvenli", () => {
    expect(maskEmail(null)).toBe("");
    expect(maskEmail(undefined)).toBe("");
  });
});
