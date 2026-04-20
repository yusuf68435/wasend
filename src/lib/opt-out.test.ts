import { describe, it, expect } from "vitest";
import { isOptOutMessage, OPT_OUT_CONFIRMATION } from "./opt-out";

describe("isOptOutMessage", () => {
  it("TR keyword'lerini yakalar", () => {
    expect(isOptOutMessage("dur")).toBe(true);
    expect(isOptOutMessage("iptal")).toBe(true);
    expect(isOptOutMessage("çık")).toBe(true);
    expect(isOptOutMessage("cik")).toBe(true);
    expect(isOptOutMessage("durdur")).toBe(true);
  });

  it("EN keyword'leri yakalar", () => {
    expect(isOptOutMessage("STOP")).toBe(true);
    expect(isOptOutMessage("unsubscribe")).toBe(true);
  });

  it("keyword ardından alan boşluk kabul eder", () => {
    expect(isOptOutMessage("stop lütfen")).toBe(true);
    expect(isOptOutMessage("dur artık")).toBe(true);
  });

  it("keyword cümle içinde tek başına geçerse yakalamaz (false pozitif önleme)", () => {
    // "stopaj" keyword'le başlasa bile whole-word değil — OPT_OUT_KEYWORDS
    // ya `===` ya `keyword + " "` eşleşmesi yapar
    expect(isOptOutMessage("stopaj vergisi")).toBe(false);
    expect(isOptOutMessage("iptalim var")).toBe(false);
  });

  it("boş mesaj/space → false", () => {
    expect(isOptOutMessage("")).toBe(false);
    expect(isOptOutMessage("   ")).toBe(false);
  });

  it("büyük/küçük harf ayrımsız", () => {
    expect(isOptOutMessage("DUR")).toBe(true);
    expect(isOptOutMessage("Stop")).toBe(true);
  });
});

describe("OPT_OUT_CONFIRMATION", () => {
  it("doğru TR metin içerir", () => {
    expect(OPT_OUT_CONFIRMATION).toContain("sonland");
    expect(OPT_OUT_CONFIRMATION).toContain("BAŞLAT");
  });
});
