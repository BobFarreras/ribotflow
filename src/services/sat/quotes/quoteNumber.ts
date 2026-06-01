/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/sat/quotes/quoteNumber.ts
 * Description: Quote number generation (PRE-YYYY-####).
 */

import { db } from "@/db";
import { quotes } from "@/db/schema/sat";
import { eq, and, sql } from "drizzle-orm";

export async function getNextQuoteNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRE-${year}-`;

  const result = await db
    .select({ maxNumber: sql<string>`MAX(${quotes.number})` })
    .from(quotes)
    .where(
      and(eq(quotes.companyId, companyId), sql`${quotes.number} LIKE ${prefix + "%"}`
    )
  );

  const maxNumber = result[0]?.maxNumber;
  let sequence = 1;

  if (maxNumber) {
    const match = maxNumber.match(/-(\d+)$/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}
