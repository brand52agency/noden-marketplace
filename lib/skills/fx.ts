import { isoDate, SkillInputError, trustedJson, type SkillHandler } from "./types";

const CODE = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function check(input: Record<string, unknown>) {
  const from = String(input.from ?? "").toUpperCase();
  const to = String(input.to ?? "").toUpperCase();
  const amount = Number(input.amount ?? 1);
  if (!CODE.test(from) || !CODE.test(to)) throw new SkillInputError("from and to must be three-letter currency codes, e.g. USD and EUR");
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) throw new SkillInputError("amount must be a number between 0 and 1,000,000,000,000");
  const date = input.date === undefined || input.date === null || input.date === "" ? null : String(input.date);
  if (date && (!DATE.test(date) || Number.isNaN(Date.parse(date)))) throw new SkillInputError("date must look like 2026-10-09");
  return { from, to, amount, date };
}

export const fx: SkillHandler = {
  validate: (input) => void check(input),
  async run(input) {
    const { from, to, amount, date } = check(input);
    if (from === to) {
      return { from, to, amount, rate: 1, converted: amount, rate_date: isoDate().slice(0, 10), source: "same currency", source_url: null, checked_at: isoDate() };
    }
    const url = `https://api.frankfurter.dev/v1/${date ?? "latest"}?base=${from}&symbols=${to}`;
    const r = await trustedJson(url, {}, 8000);
    const j = r.json as { date?: string; rates?: Record<string, number>; message?: string } | null;
    if (r.status === 404 || r.status === 422) throw new SkillInputError(`no rate available for ${from} to ${to}${date ? ` on ${date}` : ""}. Supported currencies: https://api.frankfurter.dev/v1/currencies`);
    const rate = j?.rates?.[to];
    if (r.status !== 200 || typeof rate !== "number" || !j?.date) throw new Error("the exchange-rate feed did not return a rate");
    return {
      from,
      to,
      amount,
      rate,
      converted: Math.round(amount * rate * 1e6) / 1e6,
      rate_date: j.date,
      source: "European Central Bank reference rates via Frankfurter",
      source_url: url,
      checked_at: isoDate(),
    };
  },
};
