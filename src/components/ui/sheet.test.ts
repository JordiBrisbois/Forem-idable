import { describe, expect, it } from "vitest";
import { SHEET_SIZE_CLASSES } from "@/components/ui/sheet";

describe("sheet sizes", () => {
  it("gives every semantic size a width", () => {
    expect(SHEET_SIZE_CLASSES.sm).toBe("sm:max-w-sm");
    expect(SHEET_SIZE_CLASSES.md).toContain("32rem");
    expect(SHEET_SIZE_CLASSES.lg).toContain("44rem");
    expect(SHEET_SIZE_CLASSES.xl).toContain("56rem");
    expect(SHEET_SIZE_CLASSES["2xl"]).toContain("64rem");
    expect(SHEET_SIZE_CLASSES.full).toContain("max-w-none");
  });

  it("keeps the sizes ordered", () => {
    const widthOf = (value: string) => {
      const match = value.match(/\[(\d+)rem\]/);
      return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
    };

    expect(widthOf(SHEET_SIZE_CLASSES.lg)).toBeLessThan(widthOf(SHEET_SIZE_CLASSES.xl));
    expect(widthOf(SHEET_SIZE_CLASSES.xl)).toBeLessThan(widthOf(SHEET_SIZE_CLASSES["2xl"]));
  });
});
