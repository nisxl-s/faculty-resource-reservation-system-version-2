# Project cleanup and gap review

Reviewed 19 October 2026 (Asia/Colombo).

Project: faculty-resource-reservation-system-version-2

## Completed cleanup

- Removed 22 files: an unused footer help modal, unused help stylesheet, two unreferenced copies of a background image, an obsolete feature-verification script, and 17 redundant .gitkeep files. Removed five directories that became empty.
- Removed 13 unused import bindings using parsed import declarations; retained active components and state/effect behavior.
- Removed unused @upstash/ratelimit and updated the server package lock. The separate, actively used @upstash/redis integration remains.
- Corrected the feedback page: failed submissions now display an error and preserve the user's text instead of falsely claiming the message was recorded.
- Corrected /support-review to open the staff review panel instead of member request history.
- Aligned registration guidance and validation with the server: at least eight password characters, including a number.
- Removed the obsolete reset-link logging option from setup documentation. Updated help wording to match current booking/cancellation behavior and replaced the placeholder support email with in-app help instructions.

Removed files occupied 527,453 bytes (about 515 KiB). Recovery copies are retained outside the project in this chat's work/cleanup-backup-20261019 folder. The project already contained extensive uncommitted work; this review does not claim all differences against Git were introduced by this cleanup.

## Remaining gaps, in priority order

### High: public API registration can grant faculty privileges

Evidence: server/src/routes/authRoutes.js accepts role=faculty on public POST /api/auth/register, and authController.register persists that role. reservationService treats faculty as a reviewer. Faculty can access reservation and help review APIs. The visible registration form sends student, but direct API callers can request faculty.

Recommendation: keep public self-registration for student/member accounts and require an administrator to grant faculty status, unless the institution deliberately approves another trusted verification process. Faculty review is currently campus-wide; resource/faculty assignment restrictions are not implemented. No authorization policy was changed during cleanup.

### High: local environment files are tracked by Git

Evidence: git ls-files lists server/.env and client/.env (as well as a deleted root .env entry). Adding .env to .gitignore does not stop Git tracking files already in its index.

Recommendation: remove local environment files from tracking while retaining their local copies; use .env.example for setup. Review repository history and rotate any credentials that were previously shared or pushed. No secrets were printed, and this cleanup did not alter the Git index or rewrite history. Public client environment variables are bundled into the browser and must never hold secrets.

### Medium: registration ID is stored in the phone field

Evidence: RegisterPage.jsx sends phone: facultyId; User.create saves phone to users.phone. There is no separate institutional-ID field in this registration flow.

Impact: a registration identifier appears as a phone number in profiles/support views. Decide whether the field is an institutional ID or phone number, then align the form, API and schema and migrate existing values carefully.

### Medium: rejection reasons and review audit details are incomplete

Evidence: bookinghistory.jsx submits only status: rejected; reservationService updates only reservations.status. Users receive a rejected status without a reason from the reviewer. The schema has cancellation/review-related legacy fields, but this action does not populate a rejection explanation or reviewer history.

Recommendation: add a reason and record the actor/time for review decisions. Confirm the allowed transition matrix before restricting reopen/cancellation behavior.

### Medium: booking policy is only partially defined

The server validates future times, end-after-start, resource availability, seating and conflicting bookings. Institution-specific operating hours, maximum duration and advance-booking windows are not enforced. These are policy decisions recorded as unresolved in the requirements, rather than justification for silently imposing new restrictions. Help text no longer promises unsupported one-hour/eight-hour/30-day limits.

### Medium: email is intentionally unconfigured, and delivery has operational limits

SMTP settings remain empty as requested. Self-registration works without email verification; ownership of an entered address is not proven. Real delivery is unavailable until the system sender is configured and the backend restarted.

Email queue processing and reminders require a continuously running backend. SMTP acceptance is not guaranteed inbox delivery, and a crash after acceptance can produce duplicate messages. Several routine emails are queued after the account/booking transaction rather than inside it; a crash or queue failure in that interval can lose a notification. Reset queue writes are awaited. The system logs failures and has bounded retries, but has no administrator delivery dashboard or independent worker monitoring. Retain protected database access because pending reset messages contain recovery links.

Help/feedback staff replies remain visible in the in-app history. They are not currently wired to send email notifications. Guest help submissions are supported by the backend, but guest reply retrieval is not implemented and guest replies are not emailed.

### Medium: accessibility and effect warnings remain

The complete ESLint report contains 44 warnings and zero errors: no-unused-vars (13), jsx-a11y/label-has-associated-control (19), react-hooks/exhaustive-deps (12). The normal lint command uses --quiet, so it hides warnings. Some label warnings concern custom controls and need manual review; effect warnings should be assessed for stale values before changing dependencies. Unused loading/error state also indicates some pages do not render those states. Avoid deleting effectful state setters just to suppress warnings.

### Lower priority: navigation, documentation and operational polish

- App.jsx has no wildcard route: unknown paths have no matched page content. Add a proper not-found page.
- Help still contains hard-coded phone, office hours and location details; confirm them with the institution.
- client/src/config/faculties.json and server/src/config/faculties.json duplicate shared catalogue data. They are both active and were retained. Establish one generated source to prevent drift.
- Historical SQL migrations and database/faculty_reservation.sql were retained: they may be recovery/reference data, not trash. Do not replay the SQL dump over the working database as a cleanup step. The supported setup path is the journaled migration runner.
- Backup automation, monitoring, production HTTPS/origins, full accessibility acceptance and representative load testing still need deployment-specific acceptance. Historical maintenance notes are not fresh certification of the current build.

## Verification performed

- Frontend production build: passed after final edits.
- Frontend lint: zero errors; 44 warnings retained and reported rather than suppressed.
- Backend focused tests: 15 passed.
- Database integration: passed on disposable databases, covering fresh/legacy migrations, concurrent reservations, registration, support, queued email, one-use resets and session revocation.
- npm audit: zero reported vulnerabilities in the client dependency tree and server production dependency tree at review time. This is not a guarantee against undisclosed vulnerabilities.
- Frontend import/asset scan: no remaining unreachable files under client/src based on the local static import graph; no remaining duplicate raster/SQL files by content hash in the scanned source tree. This does not prove every export or CSS selector is used at runtime.
- Live browser acceptance, real SMTP delivery and production-size load testing were not run during this cleanup.

Active dependencies, build output used by the server, local runtime logs/backups, requirements documents, database dumps and local settings were retained. Email settings remain empty. No database records were deleted, no deployment was made, and no commit was created.

## Removed file manifest

- client/src/components/footer/FooterHelpModal.jsx
- client/src/assets/css/help.css
- client/src/assets/images/bg image.jpeg
- client/public/bg-image.jpeg
- server/tests/verify_features.js
- client/public/.gitkeep
- client/src/assets/.gitkeep
- client/src/components/.gitkeep
- client/src/components/footer/.gitkeep
- client/src/components/header/.gitkeep
- client/src/context/.gitkeep
- client/src/css/.gitkeep
- client/src/hooks/.gitkeep
- client/src/pages/.gitkeep
- client/src/services/.gitkeep
- database/migrations/.gitkeep
- database/seeds/.gitkeep
- server/src/config/.gitkeep
- server/src/controllers/.gitkeep
- server/src/middleware/.gitkeep
- server/src/models/.gitkeep
- server/src/routes/.gitkeep
