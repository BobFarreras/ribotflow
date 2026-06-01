# SMTP Configuration — Quote Email Sending

> **Last updated:** 01/06/2026
> **Why this exists:** Send-quote-by-email feature was added on 01/06/2026 but didn't work in dev because `.env.local` had `SMTP_PASS` while the service reads `SMTP_PASSWORD`. This document prevents that mistake from happening again.

---

## The Bug (Found 01/06/2026)

When you click "Enviar" on a quote, **no email is sent** and there's no visible error in the UI.

### Root Cause
The system reads these env vars (see `src/services/notifications/notificationService.ts`):

```ts
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(...) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;  // ← expects SMTP_PASSWORD
```

But `.env.local` had `SMTP_PASS` (not `SMTP_PASSWORD`):

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@digitaistudios.com
SMTP_PASS=Adfama_69    # ← WRONG KEY
```

Because `SMTP_PASSWORD` is undefined, the service silently falls into the "not configured" branch and only logs a warning to the server console — nothing happens client-side.

### Why No Error Showed in UI
The modal only catches errors that bubble up from the Server Action. But `sendEmailWithAttachment` swallows the "not configured" path as a `console.warn`, so the action returns `success: true` and the user sees a success toast. **Misleading UX.**

---

## How to Fix It (1 minute)

### Option A — Edit `.env.local` (recommended)

Open `.env.local` and **change `SMTP_PASS` to `SMTP_PASSWORD`**:

```env
# --- SMTP (Mailing) ---
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@digitaistudios.com
SMTP_PASSWORD=Adfama_69
```

Save, then **restart the dev server** (`pnpm dev`). Process restart required because env vars are read on boot.

### Option B — Use the new system (port 465 = SSL)

The service detects SSL from port number:
```ts
secure: smtpPort === 465
```

Port 465 is the Hostinger recommended value, and the code already handles it correctly. **No code change needed.**

---

## Recommended Hostinger Setup

| Field | Value |
|-------|-------|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `info@digitaistudios.com` (or your full mailbox) |
| `SMTP_PASSWORD` | The mailbox password (use App Password if 2FA is on) |

> ⚠️ Don't use `SMTP_PASS` — only `SMTP_PASSWORD` is read by the service.

---

## How to Test It Works

1. `pnpm dev` (restart after editing `.env.local`)
2. Open a draft quote: `/sat/quotes/{id}`
3. Click **Enviar** in the toolbar
4. Enter your own email as the recipient
5. Click **Enviar** in the modal
6. Check your inbox (and spam)

If you see in the server console:

```
[Notification] SMTP not configured. Email would have been sent:
  To: client@exemple.com
  Subject: Pressupost PRE-2026-0001
```

…then the env vars are still wrong.

---

## What's Already Configured

| Layer | Status |
|-------|--------|
| `notificationService.sendEmailWithAttachment` | ✅ Done (lazy nodemailer import) |
| `notificationService.sendQuoteEmail` | ✅ Done |
| `actions/sat/sendQuoteEmail.ts` (Server Action) | ✅ Done |
| `components/sat/SendQuoteEmailModal.tsx` | ✅ Done |
| `QuoteEditor.tsx` "Enviar" button wired | ✅ Done |
| i18n (toast messages) | ✅ Sonner library (no new keys needed) |
| PDF attachment in email | 🔲 Pending (email sends HTML only for now) |

---

## What's Pending

1. **PDF attachment** — generate a real PDF of the quote and attach it to the email (currently only HTML body)
2. **Better error feedback** — return the "SMTP not configured" warning to the user as a real toast, not just server log
3. **CC to company** — always send a copy to the company mailbox for record
4. **Per-company SMTP** — read SMTP creds from `companies` table instead of env (multi-tenant friendly)
