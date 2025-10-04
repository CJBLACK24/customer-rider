// utils/password.ts
export type PwEval = {
  lenOK: boolean;
  capOK: boolean;
  numOK: boolean;
  noSpace: boolean;
  score: number; // 0..4
  label: "Weak" | "Medium" | "Strong";
};

export const evalPassword = (pw: string): PwEval => {
  const lenOK = pw.length >= 8 && pw.length <= 20;
  const capOK = /[A-Z]/.test(pw);
  const numOK = /\d/.test(pw);
  const noSpace = !/\s/.test(pw);
  const score = [lenOK, capOK, numOK, noSpace].filter(Boolean).length;

  let label: PwEval["label"] = "Weak";
  if (score >= 3) label = "Strong";
  else if (score === 2) label = "Medium";

  return { lenOK, capOK, numOK, noSpace, score, label };
};
