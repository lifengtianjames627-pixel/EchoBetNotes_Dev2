import { expect, test } from "vitest";
import { scaffoldCopy, scaffoldLocales } from "../../app/scaffold-copy";

const locales = ["en", "zh", "ko", "ja", "fr", "ru"] as const;
const fields = ["title", "status", "loading", "error", "notFound", "retry"] as const;

test("exports the six scaffold locales", () => {
  expect([...scaffoldLocales]).toEqual([...locales]);
});

test("returns non-empty copy for every locale", () => {
  for (const locale of locales) {
    const copy = scaffoldCopy(locale);
    for (const field of fields) {
      expect(copy[field]).toEqual(expect.any(String));
      expect(copy[field].length).toBeGreaterThan(0);
    }
  }
});

test("returns the English title for an unknown locale", () => {
  expect(scaffoldCopy("zz").title).toBe("Echoes Between Notes");
});
