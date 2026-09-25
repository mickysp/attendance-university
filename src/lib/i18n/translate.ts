import english from "./en.json";

const catalog: Record<string, string> = english;
const patterns = Object.entries(catalog).sort(([a], [b]) => b.replace(/\{\w+\}/g, "").length - a.replace(/\{\w+\}/g, "").length).flatMap(([key, value]) => {
  const slots = [...key.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
  if (!slots.length) return [];
  const expression = key.split(/\{\w+\}/g).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("([\\s\\S]*?)");
  return [{ regex: new RegExp(`^${expression}$`), slots, value }];
});

/** Translate UI copy only. Parameters and user-entered data are never translated. */
export function translateText(
  text: string | null | undefined,
  language: "th" | "en",
  parameters?: Record<string, string | number>,
): string {
  if (text == null) return "";
  const key = text.replace(/\s+/g, " ").trim();
  let translated = language === "en" ? catalog[key] ?? text : text;
  if (language === "en" && !catalog[key] && !parameters) {
    for (const pattern of patterns) {
      const match = pattern.regex.exec(key);
      if (!match) continue;
      translated = pattern.value.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
        const index = pattern.slots.indexOf(name);
        return index < 0 ? placeholder : match[index + 1];
      });
      break;
    }
  }
  if (parameters) {
    translated = translated.replace(/\{(\w+)\}/g, (match, name: string) =>
      Object.hasOwn(parameters, name) ? String(parameters[name]) : match,
    );
  }
  return translated;
}
