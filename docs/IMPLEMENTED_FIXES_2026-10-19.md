# Reservation system fixes — 19 October 2026

## Implemented

- Public registration accepts any valid email domain but creates student accounts only. Direct attempts to register faculty or admin roles are rejected. Existing administrator user-management tools still grant staff roles.
- Local server/.env and client/.env are no longer tracked by Git. Their local files remain present. The deleted root .env was also removed from the index. These removals are staged; no commit was created and unrelated changes were not staged.
- Registration IDs now have their own registration_id field in storage, API responses and profile forms. The registration form no longer saves the ID as a phone number. Existing contact values were preserved in legacy_contact_value before migrating narrowly recognized institutional ID formats. Ambiguous numeric values remain unchanged for manual verification. Profile updates preserve omitted fields rather than erasing them during role-only edits.
- Rejections require a nonempty explanation. Review metadata and reservation events commit with the reservation change, record the actor and time, and are accessible to the owner and authorized staff. The member and staff screens display the explanation and decision history. Changing approved reservation times clears the old approval and returns the request to pending. Members can cancel pending or approved bookings.
- Optional booking constraints are supported through BOOKING_MIN_MINUTES, BOOKING_MAX_MINUTES, BOOKING_ADVANCE_DAYS, BOOKING_OPEN_TIME and BOOKING_CLOSE_TIME. Values are unset by default, as requested. If configured, the server validates duration, advance window and Sri Lanka operating hours on creation, time edits and reopening. Invalid settings fail startup instead of silently weakening policy.
- All 44 previously reported lint warnings were addressed. Effects use stable callbacks with current committed state, form labels point to controls, feedback ratings support keyboard buttons, and loading/error states are visible. Lint now fails on any warning instead of hiding warnings with --quiet.
- Unknown URLs render a not-found page. Unverified phone/location/office promises were removed from Help. The backend faculty catalogue is the canonical source; frontend start/build synchronizes its generated copy. Production API requests default to the same origin, and obsolete CRA production flags were removed.
- Guest help submission is available in the shared help window. Guests receive a random private tracking code and can view their reply using the request number and code, without needing email. Only the hash is stored; incorrect codes do not expose request details. Existing guest requests made before this feature have no tracking code and remain staff-accessible.
- Welcome, reservation, recovery and password-change email records now commit with their associated database changes. A failed queue insertion rolls back the change rather than losing the notification silently. Help and feedback staff replies also queue email notifications transactionally. Raw recovery links are not included in queue-failure logs.
- The admin dashboard displays sender status and queue totals. A separate email-worker command is available for deployments that run it under a process manager. The existing in-server worker remains; database locking prevents simultaneous batch delivery. SMTP credentials remain empty and unchanged.
- Backup and empty-database restore commands are implemented. Backups include tables, records and triggers. Restore refuses a nonempty target database. A backup was saved privately under .runtime/backups before migrating the working database.

## Verification

- 17 focused backend tests pass.
- Database integration tests pass against disposable fresh and legacy databases, including duplicate migrations, concurrent booking conflicts, staff-role registration denial, separate registration IDs, mandatory rejection reasons, owner-only history access, guest tracking privacy, transactional email rollback, one-use password reset and session revocation.
- Browser checks pass for admin, faculty and member support flows at 1440, 768 and 360 pixel widths, including keyboard navigation and modal cancellation.
- New browser flows pass: not-found navigation, guest request submission and private reply lookup, staff rejection with a reason, member-visible reason and decision history. No uncaught page errors were observed in these checks.
- Backup restoration into an empty disposable database passes: each table's row count matches, both notification triggers are present, and restore into a nonempty database is rejected.
- Frontend lint passes with zero errors and zero warnings; production build passes.
- Working database migration completed after a backup. SMTP settings remain empty. No real email was sent.

## Running the changes

Restart the existing backend and refresh the frontend. The database migration is already applied. The current host's running backend process was not forcibly terminated; do not assume an old process reloads JavaScript automatically.

From server/:

- npm run backup — write a compressed private snapshot to .runtime/backups.
- npm run backup:restore -- ABSOLUTE_BACKUP_PATH EMPTY_DATABASE_NAME — restore only into an already-created, empty database.
- npm run email:worker — optional independent worker. Configure a deployment process manager to restart it on failure; SMTP remains inactive until credentials are supplied separately.

Schedule backups with the deployment's approved scheduler and copy them to protected off-machine storage. No machine-wide service or recurring schedule was installed because no destination, retention period or cadence was specified. Backups contain personal data and pending recovery messages; protect access accordingly.

## Items requiring institution or deployment decisions

- Booking restrictions intentionally remain unset. Set the optional values and restart when the institution agrees its policy.
- Authorized faculty review remains campus-wide, preserving the current institution policy; resource-specific reviewer assignments need an agreed ownership model. Existing faculty accounts were not automatically demoted because their provenance cannot be inferred safely.
- No Git history was rewritten. If old environment files were published, their secrets must be reviewed and rotated; removing tracking cannot retract historical copies.
- Ambiguous legacy contact numbers should be checked by their owners or an administrator before reclassifying them as IDs.
- Hosting-domain TLS, off-machine backup storage/retention, uptime alert delivery and production-size capacity acceptance depend on the chosen deployment. The included 20-request catalogue smoke measurement is not a production load certification.
- The pre-existing cleanup review is a historical report. This document supersedes its code-gap status; real SMTP delivery is still intentionally unconfigured.
