# SMTP Configuration — Quote Email Sending

> **Last updated:** 01/06/2026
> **Why this exists:** Send-quote-by-email feature was added on 01/06/2026. Two distinct bugs found and fixed:
> 1. `.env.local` had `SMTP_PASS` while the service reads `SMTP_PASSWORD`
> 2. Home network couldn't connect due to "self-signed certificate in certificate chain"
> This document prevents both mistakes from happening again.

---

## Bug #1 — Wrong env var name (01/06/2026)

When you click "Enviar" on a quote, **no email is sent** and there's no visible error in the UI.

### Root Cause
The system reads these env vars (see `src/services/notifications/notificationService.ts`):

```ts
const pass = process.env.SMTP_PASSWORD;  // ← expects SMTP_PASSWORD
```

But `.env.local` had `SMTP_PASS` (not `SMTP_PASSWORD`):

```env
SMTP_PASS=Adfama_69    # ← WRONG KEY
```

### Fix
Change `SMTP_PASS` to `SMTP_PASSWORD` in `.env.local`, restart dev server.

---

## Bug #2 — "self-signed certificate in certificate chain" (01/06/2026)

When sending from **home network** (or any network with a transparent HTTPS proxy / antivirus that intercepts TLS), nodemailer fails with:

```
Error: self-signed certificate in certificate chain
    at TLSSocket.<anonymous> (...)
    at Transport.verify (...)
```

### Root Cause
Some ISPs and security software replace the SMTP server's TLS certificate with their own self-signed one. Node.js (and nodemailer by default) reject self-signed certificates in the trust chain.

### Fix
Add this to `.env.local`:

```env
# DEV ONLY: accept self-signed certificates in the SMTP TLS chain
# Set to "true" (default) in production to enforce real cert validation
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

Restart the dev server. The service will pass `tls.rejectUnauthorized: false` to nodemailer.

> ⚠️ **SECURITY WARNING:** Setting this to `false` disables TLS certificate validation. The connection is still encrypted (TLS is active), but the server identity is not verified. **Use only in dev with trusted networks.** Production MUST keep it `true` (the default).

---

## All SMTP Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `SMTP_HOST` | ✅ | — | SMTP server hostname (e.g. `smtp.hostinger.com`) |
| `SMTP_PORT` | ❌ | `587` | `465` for implicit SSL, `587` for STARTTLS |
| `SMTP_USER` | ✅ | — | Full mailbox address |
| `SMTP_PASSWORD` | ✅ | — | Mailbox password (NOT `SMTP_PASS`) |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | ❌ | `true` | Set `false` to accept self-signed certs (DEV ONLY) |
| `SMTP_REQUIRE_TLS` | ❌ | `true` | Set `false` to allow plain SMTP (insecure) |

---

## Recommended Hostinger Setup

| Field | Value |
|-------|-------|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` (SSL) o `587` (STARTTLS) |
| `SMTP_USER` | `info@digitaistudios.com` |
| `SMTP_PASSWORD` | Mailbox password (use App Password if 2FA is on) |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | `false` (a casa), `true` (producció) |

---

## How to Test It Works

1. `pnpm dev` (restart after editing `.env.local`)
2. Open a draft quote: `/sat/quotes/{id}`
3. Click **Enviar** in the toolbar
4. Enter your own email as the recipient
5. Click **Enviar** in the modal
6. Check your inbox (and spam)

### Common Error Messages & Fixes

| Error in console | Cause | Fix |
|------------------|-------|-----|
| `SMTP no configurat. Falten: SMTP_HOST` | env var missing | Add to `.env.local`, restart server |
| `SMTP no configurat. Falten: SMTP_PASSWORD (not SMTP_PASS!)` | wrong key name | Rename `SMTP_PASS` to `SMTP_PASSWORD` |
| `self-signed certificate in certificate chain` | network intercepts TLS | Add `SMTP_TLS_REJECT_UNAUTHORIZED=false` |
| `nodemailer not installed` | missing dep | `pnpm add nodemailer` |
| `Invalid login: 535 Authentication failed` | wrong password | Re-check SMTP_PASSWORD or create App Password |
| `Connection timeout` | wrong host/port or firewall | Verify host, port, and that outgoing 465/587 is open |

---

## What's Already Configured

| Layer | Status |
|-------|--------|
| `notificationService.sendEmailWithAttachment` | ✅ Done (lazy nodemailer import, `tls.rejectUnauthorized` configurable) |
| `notificationService.sendQuoteEmail` | ✅ Done |
| `actions/sat/sendQuoteEmail.ts` (Server Action) | ✅ Done |
| `components/sat/SendQuoteEmailModal.tsx` | ✅ Done |
| `QuoteEditor.tsx` "Enviar" button wired | ✅ Done |
| PDF attachment in email | ✅ Done (`generateSignedQuotePdf` mètode + `acceptQuote` action) |
| TLS cert validation control | ✅ Done (`SMTP_TLS_REJECT_UNAUTHORIZED` env var) |
| Better error feedback (return error to UI) | ✅ Done (toast shows real error message) |

---

## What's Pending

1. **CC to company** — always send a copy to the company mailbox for record
2. **Per-company SMTP** — read SMTP creds from `companies` table instead of env (multi-tenant friendly)
3. **Unit tests** for `notificationService` (mocking nodemailer) — see `tests/unit/services/notifications/notificationService.test.ts` (to be added)
