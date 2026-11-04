// The only code allowed to change Operator.creditBalance. Every change writes a CreditEntry, in the same
// database transaction, with a unique `ref`, so a replayed webhook or request cannot apply twice.
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type Tx = Prisma.TransactionClient;
export type EntryKind = "purchase" | "spend" | "clawback" | "grant" | "adjustment";

export class InsufficientCredits extends Error {
  constructor() {
    super("not enough credits");
  }
}
export class DuplicateEntry extends Error {
  constructor(public ref: string) {
    super(`ledger entry ${ref} already exists`);
  }
}

const isUniqueViolation = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

async function writeEntry(tx: Tx, operatorId: string, delta: number, balanceAfter: number, kind: EntryKind, ref: string | null, note?: string) {
  try {
    await tx.creditEntry.create({ data: { operatorId, delta, balanceAfter, kind, ref, note } });
  } catch (err) {
    if (isUniqueViolation(err) && ref) throw new DuplicateEntry(ref);
    throw err;
  }
}

// Adds credits. Throws DuplicateEntry when `ref` was already applied (the caller's transaction rolls back).
export async function grantCredits(tx: Tx, operatorId: string, credits: number, kind: EntryKind, ref: string, note?: string): Promise<number> {
  if (!Number.isInteger(credits) || credits <= 0) throw new Error("grant must be a positive whole number");
  const updated = await tx.operator.update({ where: { id: operatorId }, data: { creditBalance: { increment: credits } }, select: { creditBalance: true } });
  await writeEntry(tx, operatorId, credits, updated.creditBalance, kind, ref, note);
  return updated.creditBalance;
}

// Takes credits back after a refund or chargeback. May leave the balance negative (a debt that the next
// top-up covers), because the credits may already have been spent.
export async function clawBackCredits(tx: Tx, operatorId: string, credits: number, ref: string, note?: string): Promise<number> {
  if (!Number.isInteger(credits) || credits <= 0) throw new Error("clawback must be a positive whole number");
  const updated = await tx.operator.update({ where: { id: operatorId }, data: { creditBalance: { decrement: credits } }, select: { creditBalance: true } });
  await writeEntry(tx, operatorId, -credits, updated.creditBalance, "clawback", ref, note);
  return updated.creditBalance;
}

// Spends credits. The conditional update is the lock: Postgres re-checks `creditBalance >= credits` on the
// row it just locked, so any number of simultaneous spends can never take the balance below zero.
export async function spendCredits(tx: Tx, operatorId: string, credits: number, ref: string, note?: string): Promise<number> {
  if (!Number.isInteger(credits) || credits <= 0) throw new Error("spend must be a positive whole number");
  let balance: number;
  try {
    const updated = await tx.operator.update({
      where: { id: operatorId, creditBalance: { gte: credits }, billingHoldAt: null },
      data: { creditBalance: { decrement: credits } },
      select: { creditBalance: true },
    });
    balance = updated.creditBalance;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new InsufficientCredits();
    throw err;
  }
  await writeEntry(tx, operatorId, -credits, balance, "spend", ref, note);
  return balance;
}

// Runs fn in a transaction; returns false instead of throwing when the ledger entry was already applied.
export async function once(fn: (tx: Tx) => Promise<void>): Promise<boolean> {
  try {
    await db.$transaction(fn);
    return true;
  } catch (err) {
    if (err instanceof DuplicateEntry) return false;
    throw err;
  }
}
