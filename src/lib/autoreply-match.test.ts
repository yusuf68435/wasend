import { describe, it, expect } from "vitest";
import { matchesTrigger, mergeTags } from "./autoreply-match";

describe("matchesTrigger", () => {
  it("contains (default): case-insensitive substring", () => {
    expect(matchesTrigger("Merhaba FIYAT bilgisi lütfen", "fiyat", "contains")).toBe(true);
    expect(matchesTrigger("merhaba", "selam", "contains")).toBe(false);
  });

  it("exact: full match case-insensitive, trimmed", () => {
    expect(matchesTrigger("  Fiyat  ", "fiyat", "exact")).toBe(true);
    expect(matchesTrigger("fiyat bilgisi", "fiyat", "exact")).toBe(false);
  });

  it("regex: pattern match with i flag", () => {
    expect(matchesTrigger("Order #12345", "^order", "regex")).toBe(true);
    expect(matchesTrigger("Order #12345", "\\d{5}", "regex")).toBe(true);
    expect(matchesTrigger("foo bar", "^order", "regex")).toBe(false);
  });

  it("regex: invalid pattern returns false without throwing", () => {
    expect(matchesTrigger("test", "[invalid(", "regex")).toBe(false);
  });

  it("boş input güvenli", () => {
    expect(matchesTrigger("", "anything", "contains")).toBe(false);
    expect(matchesTrigger("anything", "", "contains")).toBe(false);
  });

  it("null/undefined matchType → contains default", () => {
    expect(matchesTrigger("hello world", "world", null)).toBe(true);
    expect(matchesTrigger("hello world", "world", undefined)).toBe(true);
  });
});

describe("mergeTags", () => {
  it("yeni etiket ekler", () => {
    expect(mergeTags("vip,regular", "new-tag")).toBe("vip,regular,new-tag");
  });

  it("dup tag ignore edilir (case-insensitive)", () => {
    expect(mergeTags("vip,regular", "VIP")).toBe("vip,regular");
  });

  it("çoklu etiket ekler, dup'ları atlar", () => {
    expect(mergeTags("a,b", "c,d,a")).toBe("a,b,c,d");
  });

  it("boş/null existing + tag → sadece eklenen", () => {
    expect(mergeTags(null, "x,y")).toBe("x,y");
    expect(mergeTags("", "x")).toBe("x");
  });

  it("boş toAdd → existing olduğu gibi", () => {
    expect(mergeTags("a,b", null)).toBe("a,b");
    expect(mergeTags("a,b", "")).toBe("a,b");
  });

  it("whitespace trim", () => {
    expect(mergeTags("a , b", "  c  ")).toBe("a,b,c");
  });
});
