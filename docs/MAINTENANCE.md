# Maintenance and verification report

**Updated:** 18 October 2026

## Current outcome

The identified application/setup gaps have been addressed: atomic reservation writes, protected review fields, safe reactivation, administrator cancellation, current-account session checks, transactional single-use recovery, neutral recovery responses, production-safe logging/errors, canonical schema upgrades, private schedule responses, bounded lists, faculty/support review interfaces, safe startup helpers and working account/demo provisioning.

The frontend now uses Vite instead of Create React App/CRACO. Application and vendor code are split into separate chunks. Backend development uses Node's built-in watch mode. Both npm dependency audits report **zero known vulnerabilities**, including development dependencies, at the time of verification. This is an audit result, not a guarantee against undiscovered vulnerabilities.

## Changes by issue

| Identified issue | Resolution |
| --- | --- |
| Concurrent booking requests could overlap | One transaction service locks the resource before checking/inserting/updating reservations. Eight simultaneous requests for one interval produce one accepted booking and seven conflicts. |
| Owners could pass approved status through edit | Generic edits reject status, owner and resource changes. Reviews require faculty/admin permission; reviewers cannot approve their own bookings. |
| Partial/reopened intervals bypassed validation | Effective intervals are validated for calendar correctness, ordering, future timing and conflicts. Closed-record edits are rejected. Reviewer reactivation repeats checks under the same lock. |
| Admin cancellation used the wrong owner ID | Cancellation checks owner/admin permission inside the transaction and updates the selected record independently of the acting admin's ID. |
| Old or changed accounts retained JWT access | Every protected request checks current account existence, active state, role and token version. Password/role changes revoke previous token versions. Old-format sessions must sign in again. |
| Fallback production signing secret | Production refuses missing, short or example secrets. Development has a random ephemeral fallback instead of a shared hard-coded key. |
| Account enumeration and reset-link logs | Unknown/known email requests share a neutral response. Reset links are only logged through explicit development opt-in. SMTP failure never prints the link. |
| Concurrent reset consumption and lockout counting | Reset issuance/consumption use transactions and account locks. A reset token can succeed once. Failed-login counters increment atomically. |
| Inconsistent database setup | Startup, fresh setup and upgrade commands share a journaled migration runner and canonical schema definitions. Missing columns/indexes are checked before DDL; insert/status notification triggers are installed in both paths. |
| Public schedule data included private booking fields | Occupancy responses omit user identity, purpose and notes. Full reviewer records remain restricted to faculty/admin. |
| Unbounded or malformed list requests | Core lists use validated limit/offset bounds; supported page values are included in cache keys. Existing collection screens fetch bounded batches, while new queues page 20 records at a time. |
| Missing faculty/support workflows | Integrated booking review into Reservations and support history/replies/staff responses into the floating Help & Support panel with server-enforced permissions. |
| Keyboard/motion issues | Navigation toggles work by keyboard and expose expanded state. Confirmation dialogs trap focus, restore focus, and respect the focused cancellation button when Enter is pressed. The animated background honors reduced-motion preferences. |
| Startup helper killed unrelated applications | Launcher skips occupied ports and records its own process identity/start time. Its stop option only stops matching processes it launched. Logs are kept in ignored .runtime files. |
| Invalid SQL provisioning hashes | Replaced placeholder admin/password/seed SQL utilities with bcrypt-based provisioning and development seed commands using operator-supplied passwords. |
| Obsolete build warnings/dependency advisories | Replaced the old frontend toolchain with Vite/standalone ESLint; upgraded routing and compatible backend dependencies; removed the old watcher. Final builds have no old CRA/browser-data warnings. |
| SRS format | Updated the requirements to version 1.1 and delivered Word format. Removed the user-facing SRS PDFs from project/output folders. |

## Verification evidence

| Check | Result |
| --- | --- |
| Focused backend tests | 8 passed, 0 failed |
| Database acceptance suite | Passed against randomly named disposable databases |
| Schema upgrade paths | Fresh and legacy schemas each migrated twice; legacy account data preserved and both triggers present |
| Concurrent conflicting submissions | 1 accepted / 7 rejected with HTTP 409 |
| Adjacent intervals and reactivation | Adjacent requests accepted; conflicting reopened requests rejected |
| Recovery/session checks | One-use reset under concurrency; old tokens rejected after reset, demotion and account disabling |
| Browser checks | Faculty queue, admin support queue and member history loaded without uncaught errors at 1440, 768 and 360 pixels |
| Keyboard checks | Navigation toggle, modal focus wrapping and cancellation through Enter passed |
| Frontend lint | Passed with zero errors |
| Production build | Vite build passed; measured final run about 0.8 seconds |
| Dependency audits | Client 0; server 0 known vulnerabilities |
| Local read concurrency smoke test | 20 catalogue requests succeeded; measured p95 69.8 ms on a small disposable fixture |
| Backup recovery exercise | Export restored into a disposable database; users/resources/reservations counts matched |
| Working installation | Migration applied after backup; frontend port 3000 and API readiness port 5000 returned HTTP 200 |
| Word document | Opened in Word, exported privately for layout checking and all 11 rendered pages inspected |

The concurrency smoke measurement uses a small local fixture. It does not certify the SRS's proposed 1000-resource/10000-reservation load target. Browser checks route real UI requests to the disposable API; response data is not mocked. Real SMTP delivery was not attempted because this installation has no configured SMTP account.

## Preservation and operational notes

The original cleanup snapshot remains in this chat's work/original-project folder. A second pre-fix source snapshot is in work/before-hardening. A local database export is retained at work/database-before-hardening.sql. The old frontend dependency directory/lockfile was retained in the task backup during the toolchain replacement. These are private local backups, not repository deliverables.

Existing unrelated source changes and server credentials were preserved. The old CRA-only lint-disable setting was removed from client/.env.production; API configuration remains compatible with REACT_APP_API_URL, with VITE_API_URL preferred. No application accounts/passwords, seed records or booking records were changed as part of testing. The working database received schema upgrades only. No deployment, email delivery or destructive project-data import was performed.

Both development servers are running. Refresh the browser, then sign out and sign in again to replace the old-format access token. Reviewers use Reservations (/booking-history); all roles access support history and replies through the floating Help & Support button. Staff response tools are available inside that same panel.

## Remaining institutional or deployment acceptance

- Confirm institutional duration, advance-booking, operating-hours, reviewer-assignment and data-retention policies before adding those rules. Existing manual approval and campus-wide faculty review were preserved; Asia/Colombo booking time was explicitly confirmed.
- Configure production HTTPS/origin settings, a unique signing secret and SMTP, then test real recovery delivery in that environment.
- Set backup frequency/retention and RPO/RTO/service-level targets. A local restore was verified, but operational commitments remain to be approved.
- Run the agreed production-size load profile and a full assistive-technology review. Core responsive/keyboard checks passed; no accessibility certification is claimed.
- Recurring scheduling, favourites, SSO, calendar integration and automated institutional policies remain future product features, not broken existing workflows.

## Earlier cleanup

The first pass removed 36 obsolete files, corrected filtered-response caching and bounded the local cache. The following is the historical removal list from that pass. Additional removals during hardening include CRA/CRACO entry/config files, invalid SQL provisioning utilities and the SRS PDF. Source entry files moved from App.js/index.js to App.jsx/main.jsx for the Vite build.

## Removed files

- client/src/assets/css/footer.css
- client/src/assets/css/hero.css
- client/src/components/Aurora.css
- client/src/components/Aurora.jsx
- client/src/components/footer/Footer.css
- client/src/components/footer/index.js
- client/src/components/footer.jsx
- client/src/components/header/Header.css
- client/src/components/header/Header.jsx
- client/src/components/header/Navbar.js
- client/src/components/navbar.jsx
- client/src/css/admin.css
- client/src/css/features.css
- client/src/css/footer.css
- client/src/css/global.css
- client/src/css/hero.css
- client/src/css/nav.css
- client/src/css/navbar.css
- client/src/css/notify.css
- client/src/css/user.css
- client/src/css/user_management.css
- client/src/hooks/animations.js
- client/src/hooks/carousel.js
- client/src/hooks/extra.js
- client/src/hooks/mobile-nav.js
- client/src/hooks/navbar.js
- client/src/hooks/useCarousel.js
- client/src/hooks/useFadeScroll.js
- client/src/hooks/useMobileNavbar.js
- client/src/hooks/useNavbarEffects.js
- client/src/LoadingScreen.css
- client/src/LoadingScreen.jsx
- client/README.md
- AUDIT_REPORT.md
- IMPLEMENTATION_PLAN_V2.md
- database/migrations/002_example_migration.sql

