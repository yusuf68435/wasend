import { describe, it, expect } from "vitest";
import { isInBusinessHours } from "./timezone";

describe("isInBusinessHours", () => {
  // Pazartesi 2026-04-20 10:00 Istanbul (UTC+3) = 07:00 UTC
  const monMorning = new Date(Date.UTC(2026, 3, 20, 7, 0));
  // Pazartesi 2026-04-20 22:00 Istanbul = 19:00 UTC
  const monNight = new Date(Date.UTC(2026, 3, 20, 19, 0));
  // Pazar 2026-04-19 12:00 Istanbul = 09:00 UTC
  const sunNoon = new Date(Date.UTC(2026, 3, 19, 9, 0));

  it("hours null → her zaman true (iş saati tanımlı değil)", () => {
    expect(isInBusinessHours(monMorning, "Europe/Istanbul", null, null, null)).toBe(true);
    expect(isInBusinessHours(monNight, "Europe/Istanbul", "", "", "")).toBe(true);
  });

  it("pazartesi sabah 10, 09:00-18:00 arası → true", () => {
    expect(
      isInBusinessHours(monMorning, "Europe/Istanbul", "09:00", "18:00", "1,2,3,4,5"),
    ).toBe(true);
  });

  it("pazartesi gece 22, 09:00-18:00 → false", () => {
    expect(
      isInBusinessHours(monNight, "Europe/Istanbul", "09:00", "18:00", "1,2,3,4,5"),
    ).toBe(false);
  });

  it("pazar (work day değil), iş saatinde bile → false", () => {
    expect(
      isInBusinessHours(sunNoon, "Europe/Istanbul", "09:00", "18:00", "1,2,3,4,5"),
    ).toBe(false);
  });

  it("overnight (22:00-06:00) aralığı doğru yorumlar", () => {
    // Pazartesi gece 22:00 (Istanbul)
    expect(
      isInBusinessHours(monNight, "Europe/Istanbul", "22:00", "06:00", "0,1,2,3,4,5,6"),
    ).toBe(true);
    // Pazartesi sabah 10:00 (Istanbul) — 22:00-06:00 dışında
    expect(
      isInBusinessHours(monMorning, "Europe/Istanbul", "22:00", "06:00", "0,1,2,3,4,5,6"),
    ).toBe(false);
  });

  it("hatalı HH:mm formatı → true döner (iş saati kabul et)", () => {
    expect(
      isInBusinessHours(monMorning, "Europe/Istanbul", "garbage", "alsogarbage", null),
    ).toBe(true);
  });
});
