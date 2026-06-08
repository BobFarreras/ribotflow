/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/notifications/emailTemplates.ts
 * Description: HTML email templates for SAT notification events.
 *              Kept separate from the service so the templates can be edited
 *              and tested without touching transport logic.
 */

import type { CheckInNotificationData, CompletionNotificationData } from "./notificationService";

function wrap(title: string, body: string, companyName: string): string {
  return `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${body}
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
  <p style="font-size: 12px; color: #6b7280;">Notificació automàtica de ${companyName} via RIBOTFLOW</p>
</div>`;
}

export function checkInTemplate(data: CheckInNotificationData, companyName: string): string {
  return wrap(
    "Check-in realitzat",
    `<h2 style="color: #0d9488;">Check-in realitzat</h2>
     <p><strong>Tècnic:</strong> ${data.technicianName}</p>
     <p><strong>Ordre:</strong> ${data.workOrderNumber} — ${data.workOrderTitle}</p>
     <p><strong>Client:</strong> ${data.clientName}</p>
     <p><strong>Hora:</strong> ${data.checkInTime.toLocaleString("ca-ES")}</p>
     ${data.distanceToClient ? `<p><strong>Distància al client:</strong> ${Math.round(data.distanceToClient)}m</p>` : ""}`,
    companyName
  );
}

export interface InvitationEmailData {
  inviteeName: string;
  inviteeEmail: string;
  invitedByName: string;
  invitationUrl: string;
  role: string;
}

export function invitationTemplate(data: InvitationEmailData, companyName: string): string {
  const roleLabel =
    data.role === "ADMIN"
      ? "Administrador"
      : data.role === "TECHNICIAN"
        ? "Tècnic"
        : "Oficina";
  return wrap(
    "Et conviden a unir-te",
    `<h2 style="color: #0d9488;">Et conviden a unir-te a ${companyName}</h2>
     <p><strong>${data.invitedByName}</strong> t'ha convidat a formar part de l'equip com a <strong>${roleLabel}</strong>.</p>
     <p>Fes clic al botó següent per crear el teu compte i començar a treballar:</p>
     <div style="text-align: center; margin: 30px 0;">
       <a href="${data.invitationUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Acceptar invitació</a>
     </div>
     <p style="font-size: 13px; color: #6b7280;">Aquest enllaç caducarà en 7 dies. Si no has sol·licitat aquesta invitació, pots ignorar aquest missatge.</p>`,
    companyName
  );
}

export function completionTemplate(data: CompletionNotificationData, companyName: string): string {
  const durationText = data.durationMinutes
    ? `${Math.floor(data.durationMinutes / 60)}h ${data.durationMinutes % 60}m`
    : "N/A";
  return wrap(
    "Ordre completada",
    `<h2 style="color: #0d9488;">Ordre completada</h2>
     <p><strong>Tècnic:</strong> ${data.technicianName}</p>
     <p><strong>Ordre:</strong> ${data.workOrderNumber} — ${data.workOrderTitle}</p>
     <p><strong>Client:</strong> ${data.clientName}</p>
     <p><strong>Hora de finalització:</strong> ${data.completedAt.toLocaleString("ca-ES")}</p>
     <p><strong>Durada de la feina:</strong> ${durationText}</p>
     ${data.travelDistanceKm ? `<p><strong>Distància desplaçament:</strong> ${data.travelDistanceKm} km</p>` : ""}
     ${data.travelCost ? `<p><strong>Cost desplaçament:</strong> ${data.travelCost.toFixed(2)} EUR</p>` : ""}`,
    companyName
  );
}
