/**
 * Creation/modification date: 12/06/2026
 * Path: src/app/p/[token]/page.tsx
 * Description: Public quote view page. Clients can accept or reject
 *              a quote without logging in, using a share token.
 */

import { notFound } from "next/navigation";
import { getQuoteByToken } from "@/actions/sat/quotes/publicQuote";
import { PublicQuoteView } from "@/components/sat/quotes/PublicQuoteView";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata = {
  title: "Pressupost · RIBOTFLOW",
};

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params;
  const result = await getQuoteByToken(token);

  if (!result.success || !result.data) {
    notFound();
  }

  return <PublicQuoteView quote={result.data} token={token} />;
}
