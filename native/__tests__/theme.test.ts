import { mixColors, parseColor, resolvePhoneTheme, withAlpha } from "../src/components/theme.tsx";

describe("theme tokens", () => {
  it("parses hex and rgb colours", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255, 1]);
    expect(parseColor("#2e5945")).toEqual([46, 89, 69, 1]);
    expect(parseColor("#00000080")?.[3]).toBeCloseTo(0.5, 2);
    expect(parseColor("rgba(10, 20, 30, 0.4)")).toEqual([10, 20, 30, 0.4]);
    expect(parseColor("hsl(10 20% 30%)")).toBeNull();
  });
  it("mixes and fades colours, passing unknown formats through", () => {
    expect(mixColors("#000000", "#ffffff", 0.5)).toBe("rgb(128, 128, 128)");
    expect(withAlpha("#ffffff", 0.25)).toBe("rgba(255, 255, 255, 0.250)");
    expect(mixColors("var(--x)", "#fff", 0.5)).toBe("var(--x)");
  });
  it("resolves light, dark, and system appearances with overrides", () => {
    expect(resolvePhoneTheme().appearance).toBe("light");
    expect(resolvePhoneTheme({ appearance: "dark" }).background).toBe("#1b211d");
    expect(resolvePhoneTheme({ appearance: "system" }, "dark").appearance).toBe("dark");
    expect(resolvePhoneTheme({ appearance: "system" }, null).appearance).toBe("light");
    const custom = resolvePhoneTheme({ accent: "#285dab", radius: 12 });
    expect(custom.accent).toBe("#285dab");
    expect(custom.radius).toBe(12);
    expect(custom.accentSoft).not.toBe(custom.background);
    expect(resolvePhoneTheme({ radius: NaN }).radius).toBe(20);
  });
});
