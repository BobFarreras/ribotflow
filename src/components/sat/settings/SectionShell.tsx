/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SectionShell.tsx
 * Description: Visual shell for the numbered sections of the company
 *              settings form. Renders the step circle + title + an
 *              optional description and wraps the body in a card.
 *              Reused by every Company*Section component.
 */

import type { ReactNode } from "react";

interface Props {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionShell({ step, title, description, children }: Props) {
  return (
    <section>
      <h3 className="section-heading">
        <span className="section-heading-step">{step}</span>
        {title}
      </h3>
      {description && <p className="section-description">{description}</p>}
      <div className="section-card">{children}</div>
    </section>
  );
}
