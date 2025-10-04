// utils/phone.ts

// helper to render flag emoji from country code (e.g., "PH" -> 🇵🇭)
export const toFlagEmoji = (cc: string) =>
  cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

// Format PH phone for display as "+63 9xx xxx xxxx" (accepts 09… or 639…)
export const formatPhDisplay = (input: string) => {
  const d = input.replace(/\D/g, "");
  let digits = d;

  if (digits.startsWith("09")) digits = "63" + digits.slice(1);
  if (digits.startsWith("9")) digits = "63" + digits; // allow starting with 9

  digits = digits.slice(0, 12); // 63 + 10

  if (!digits.startsWith("63")) return input;
  const rest = digits.slice(2); // 9xxxxxxxxx
  const p1 = rest.slice(0, 3);
  const p2 = rest.slice(3, 6);
  const p3 = rest.slice(6, 10);
  const spaced =
    rest.length <= 3
      ? `+63 ${p1}`
      : rest.length <= 6
      ? `+63 ${p1} ${p2}`
      : `+63 ${p1} ${p2} ${p3}`;
  return spaced.trim();
};

// Convert display string to E.164 "+63XXXXXXXXXX"
export const toE164FromDisplay = (display: string): string | null => {
  const digits = display.replace(/\D/g, "");
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  return null;
};
