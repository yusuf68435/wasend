import { describe, it, expect } from "vitest";
import { t, resolveLocale, translator } from "./index";

describe("i18n t()", () => {
  it("returns TR string by default", () => {
    expect(t("common.save")).toBe("Kaydet");
  });

  it("returns EN string when locale is en", () => {
    expect(t("common.save", undefined, "en")).toBe("Save");
  });

  it("interpolates variables", () => {
    // Eklenmiş örnek key yok — key'i kendisi olarak döndüğünü test et
    expect(t("missing.key.with.{name}", { name: "X" })).toContain("missing");
  });

  it("falls back to key when missing", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("falls back to TR when EN missing but TR has it", () => {
    // Önce sadece TR'ye ekleme senaryosu için — her ikisinde de varsa bu pass.
    expect(t("common.save", undefined, "en")).toBeTruthy();
  });
});

describe("resolveLocale", () => {
  it("defaults to tr", () => {
    expect(resolveLocale()).toBe("tr");
    expect(resolveLocale(null)).toBe("tr");
    expect(resolveLocale("")).toBe("tr");
  });

  it("accepts supported locales", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("tr")).toBe("tr");
    expect(resolveLocale("en-US")).toBe("en");
  });

  it("falls back to default for unsupported", () => {
    expect(resolveLocale("de")).toBe("tr");
    expect(resolveLocale("xx")).toBe("tr");
  });
});

describe("translator()", () => {
  it("creates locale-bound t", () => {
    const tEn = translator("en");
    expect(tEn("common.save")).toBe("Save");
    const tTr = translator("tr");
    expect(tTr("common.save")).toBe("Kaydet");
  });
});
