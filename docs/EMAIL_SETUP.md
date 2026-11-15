# Email services

Registration accepts any syntactically valid email domain without requiring email verification. The address must belong to the user to receive recovery links.

## Gmail setup

In server/.env set SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER to your full sender address, SMTP_PASS to a Google App Password, and SMTP_FROM to that same authorized sender address with an optional display name. Enable Google 2-Step Verification to create an App Password if available for your account. Never commit credentials. Use CLIENT_URL=http://localhost:3000 for this PC, or a reachable HTTPS website address for other devices. Restart the backend after changes. Run npm run email:check from server to verify authentication without sending mail.

## Delivery

Welcome, password reset, password changed, reservation requested/updated/approved/rejected/cancelled, and approved reservation reminders are supported. Reminders are queued within 24 hours before the start, once per reservation time range, while the backend is running.

The backend creates email_outbox on startup. Account, password, reservation and staff-reply changes insert their email records in the same database transaction. Admins can view queue counts on the dashboard. An optional independent worker runs with npm run email:worker. It processes messages every 30 seconds with eight bounded exponential-backoff attempts. Reset links expire in one hour; other transactional messages expire in 24 hours. Expired and sent bodies are cleared; metadata is removed seven days after expiry. Restrict database access and protect backups because pending reset messages contain recovery URLs. Delivery is at least once: a process crash after SMTP acceptance can result in a duplicate. SMTP acceptance is not proof of inbox delivery. Check Gmail spam and bounces.

Inspect pending/failed delivery without exposing message bodies:

SELECT id, subject, attempts, sent_at, last_error, next_attempt_at, expires_at FROM email_outbox ORDER BY id DESC LIMIT 50;

After fixing credentials, unexpired exhausted messages can be retried by resetting attempts=0 and next_attempt_at=NOW() for the specific outbox ID. Expired reset requests require a fresh request.

The public forgot-password response does not disclose whether an account exists. Outbox/database failures return an error; SMTP failures are logged by outbox ID and retried without logging tokens or credentials. Registration and booking remain available when SMTP is unavailable. Database/outbox failures roll back the associated change rather than losing its notification. Guest help requests can be tracked with a private code even when email is disabled.

Test with a real mailbox: register, receive welcome, request reset, receive and open link, change password, verify old password and reused token fail, then create/approve/cancel a reservation and inspect delivery. Reminders require an approved upcoming reservation. Production requires HTTPS and a continuously running backend.
