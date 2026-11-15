# Faculty Resource Reservation System

## Software Requirements Specification

**Document version:** 1.1  
**Date:** 18 October 2026  
**Status:** Proposed requirements baseline for stakeholder review  
**Audience:** Faculty resource owners, administrators, developers and testers

This specification defines the intended behavior of the Faculty Resource Reservation System and the criteria for accepting it. The system centralizes campus resource discovery, booking requests and administrative review. It includes user accounts, notifications, feedback and help requests. The current implementation supports these areas to varying degrees; the implementation assessment in Section 11 records the implemented safeguards and the verification still required for production.

## 1 Purpose and scope

### 1.1 Product goals

The system shall give students and faculty a single catalogue of institutional resources, record accountable booking requests, and help reviewers avoid conflicting allocations. Administrators shall maintain resource and account information. Users shall be able to understand the outcome of their requests and obtain support.

Success means that an authorized user can discover an available resource, submit a valid request, receive a clear status, and later inspect or cancel the request without exposing another user's private information.

### 1.2 Included scope

The product covers student/faculty registration, authentication, account recovery, profiles, resource browsing, availability checks, reservation submission and review, administrative management, in-app notifications, feedback, and guest/authenticated help requests. The client is a browser application backed by a JSON API and a relational database.

### 1.3 Excluded scope

Payments, physical access control, attendance, inventory checkout/return tracking, calendar-provider synchronization, SSO, native mobile applications and automated room hardware are outside this baseline. Recurring scheduling, favourites, email booking alerts and configurable institutional booking policies are future scope unless explicitly approved.

### 1.4 Definitions

| Term | Meaning |
| --- | --- |
| Resource | A classroom, lab, item of equipment, hall or other reservable facility |
| Reservation | A user request for one resource during a defined time interval |
| Reviewer | Faculty member or administrator permitted to decide reservation status |
| Owner | The authenticated user who submitted a reservation or support item |
| Active reservation | A pending or approved reservation that blocks its resource's time slot |
| Conflict | Two active reservations for the same resource with overlapping time intervals |
| JWT | Signed access token supplied as a bearer token to the API |
| P1 / P2 | Required for release / desirable after core release, respectively |

## 2 Stakeholders and access

### 2.1 Actors

Guests may read public information, register, sign in, recover accounts and submit help requests with a valid contact email. Students and faculty may browse the protected catalogue, manage their own reservations/profile and submit feedback. Faculty may review reservations and help requests through authorized APIs. Administrators manage accounts, resources, all reservations, notifications and feedback responses.

The institution shall nominate the first administrator through a controlled database operation. Public registration shall never create an administrator account.

### 2.2 Access matrix

| Action | Guest | Student | Faculty | Admin |
| --- | --- | --- | --- | --- |
| Register or request password recovery | Yes | Yes | Yes | Yes |
| Browse protected catalogue | No | Yes | Yes | Yes |
| Create a reservation | No | Yes | Yes | Yes |
| View or edit own reservation | No | Yes | Yes | Yes |
| View another user's full reservation | No | No | Yes | Yes |
| Review reservation status | No | No | Yes | Yes |
| Manage resources or accounts | No | No | No | Yes |
| Submit help | Email required | Yes | Yes | Yes |
| Review help queue | No | No | Yes | Yes |
| Submit feedback | No | Yes | Yes | Yes |
| Respond to feedback | No | No | No | Yes |

Faculty and administrator reviewers have a dedicated reservation queue and support queue. Faculty review remains campus-wide, preserving the existing API permission model. Reviewers cannot approve their own reservations. Administrators additionally manage users/resources and feedback responses. A future institution-specific resource assignment scheme is outside this baseline.

## 3 System context and constraints

The React client communicates with the Express API over HTTP during local development and HTTPS in production. The API reads/writes MySQL through a connection pool. Redis may cache responses, with bounded local caching when remote caching is not configured. SMTP delivers password-reset links when configured.

The repository contains separate frontend/backend dependency lockfiles. Canonical table/trigger definitions are maintained in database/schema.sql. Runtime startup and the migration CLI use one journaled upgrade runner, which checks missing columns/indexes, preserves existing rows and installs notification triggers. Existing installations must be backed up before schema upgrades. Application data shall not be replaced by a sample dump during an upgrade.

Supported desktop/mobile browsers and the Node/database version matrix must be recorded during release testing. This baseline does not assert that a specific browser, database version or concurrency capacity has already been certified.

## 4 Functional requirements

All requirements below are P1 unless marked P2. A requirement expresses intended behavior, not proof that the current code already satisfies it.

### 4.1 Accounts and authentication

**FR-A01 Registration.** The system shall require a full name, valid unique email and a password of at least eight characters containing a number. Public role selection shall be limited to student or faculty. Acceptance: valid data creates one account; duplicate email, invalid password and an admin role request are rejected.

**FR-A02 Authentication.** The system shall verify the password against its stored bcrypt hash and issue an expiring JWT containing the account identity and role. Acceptance: valid credentials permit protected requests; absent, malformed or expired tokens receive 401 responses.

**FR-A03 Access control.** The API shall enforce role and ownership restrictions independently of browser navigation. Acceptance: changing client-side user data cannot grant administrator access, and a user cannot read or modify another user's private records through guessed identifiers.

**FR-A04 Lockout.** The system shall lock an account for 15 minutes after five failed login attempts and reset failure state on a successful login/password change. Acceptance: failed attempts and recovery after the window are tested using a controlled clock or test account.

**FR-A05 Profiles.** Authenticated users shall read/update permitted personal fields and change their password after supplying the current password. Users shall not change their own role through the profile endpoint. Acceptance: a profile edit preserves the role; an incorrect current password prevents a password change.

**FR-A06 Password recovery.** The system shall issue a random single-use reset token valid for one hour, store only its SHA-256 hash and validate expiry/use before changing a password. Acceptance: a valid token succeeds once; expired, altered and reused tokens fail. Recovery responses shall not disclose account existence in the production baseline.

**FR-A07 Account administration.** Administrators shall list, create, edit and delete accounts, subject to explicit protection against deleting or demoting their own active administrator account. Acceptance: public/student requests are denied; rejected self-management actions leave data unchanged.

**FR-A08 Session invalidation.** Account deletion, disabling, privilege reduction and password reset shall prevent continued use of invalidated credentials within a documented revocation interval. Acceptance: a previously issued token cannot retain revoked privileges beyond that interval. The API checks the current account, active flag, role and token version on every protected request. Password changes/resets and role changes invalidate previous versions. Tokens from the old format require sign-in again after upgrading.

### 4.2 Resource catalogue

**FR-R01 Discovery.** Authenticated users shall list resources and filter by type, status and building. Acceptance: each filter combination returns only matching records; cached results cannot leak between filter combinations.

**FR-R02 Details.** Users shall view a resource's identifier, name, type, building/location, capacity, description, status and available image references. Acceptance: missing resources return 404; missing images do not prevent a readable details view.

**FR-R03 Administration.** Only administrators shall create, update or delete resources. Types shall be classroom, lab, equipment, hall or other; statuses shall be available, unavailable or maintenance. Acceptance: invalid values are rejected and successful writes invalidate cached catalogue responses.

**FR-R04 Availability.** The API shall evaluate a valid time interval against active reservations and resource status. Acceptance: unavailable/maintenance resources cannot be reserved; adjacent bookings are allowed and overlapping active bookings are blocked.

**FR-R05 Statistics.** Administrators shall view resource counts by type/availability; users may request popular resources. Acceptance: statistics reflect persisted records and do not expose account secrets.

### 4.3 Reservations

**FR-B01 Submission.** An authenticated user shall request a resource with a start/end time and optional purpose/notes. The resource must exist and be available, start must precede end, and a new request must not start in the past. Acceptance: invalid input causes no insertion; a valid request is linked to the token's user identity and starts as pending.

**FR-B02 Conflict integrity.** The system shall block simultaneous active reservations for the same resource. Intervals shall use the half-open rule: existing start is before requested end and existing end is after requested start. Acceptance: two concurrent conflicting submissions yield exactly one persisted active reservation; adjacent intervals can both succeed.

**FR-B03 Personal history.** Users shall list their own requests, filter by status, view details and see upcoming approved bookings. Acceptance: a student cannot retrieve another user's full booking through a detail endpoint.

**FR-B04 Editing.** Owners may edit permitted timing/purpose/notes fields under the agreed lifecycle policy. An owner shall not approve their own booking by passing a status field to the general edit endpoint. Acceptance: edits revalidate the effective interval, ownership and conflicts, including when only one time field changes.

**FR-B05 Review.** Authorized faculty/admin reviewers shall approve, reject or return requests to pending according to the agreed state-transition policy. Acceptance: invalid status values are rejected and reactivation/approval cannot introduce a conflict.

**FR-B06 Cancellation.** Owners and administrators shall cancel a reservation while retaining its history. Acceptance: cancellation releases the slot and an administrator can cancel another user's booking through the supported cancellation path.

**FR-B07 Administration.** Administrators shall list/filter all reservations and delete a record when operationally appropriate. Acceptance: list filters do not share cached results; deletion and status changes invalidate reservation lists.

**FR-B08 Schedule visibility.** Authenticated users shall inspect occupied times needed to choose a resource slot without receiving unnecessary personal details. Acceptance: date/availability responses contain the minimum fields required for scheduling. Date queries expose resource/time/status fields and omit owner identity, purpose and notes.

### 4.4 Notifications

**FR-N01 Delivery.** A reservation creation/status change shall create an in-app notification for its owner. Acceptance: exactly the intended recipient sees it after a change. The deployment must install equivalent database triggers or implement explicit application delivery.

**FR-N02 Personal actions.** Users shall list notifications, mark one/all of their messages as read and delete their own messages. Acceptance: identifiers belonging to another user do not change that user's messages.

**FR-N03 Administration.** Administrators shall list system notifications and create user-targeted notifications. Acceptance: non-admin creation is denied and required recipient/title/message fields are validated.

**FR-N04 Refresh behavior.** Notifications shall become visible on the next successful supported refresh. WebSocket/push delivery is outside this baseline; the interface shall not imply guaranteed instant push delivery.

### 4.5 Feedback and help

**FR-S01 Feedback.** Authenticated users shall submit category, subject, message and optional rating from one to five, then inspect their own submissions. Categories shall be bug, feature, improvement, general or other. Acceptance: invalid ratings/empty required fields are rejected.

**FR-S02 Feedback response.** Administrators shall filter feedback, respond and update its processing status. Acceptance: a response records the responder and response time; another ordinary user cannot read the item.

**FR-S03 Help submission.** Guests shall submit a topic/question and valid contact email. Signed-in users shall submit against their verified identity. Priorities shall be low, medium, high or urgent. Acceptance: a supplied invalid bearer token is rejected rather than silently treated as a valid user; a valid token associates the request with that user.

**FR-S04 Help management.** Owners shall read their own help history/details. Faculty/admin reviewers shall filter the help queue, respond and set open, in_progress, resolved or closed status. Acceptance: unauthorized queue/detail requests fail and a valid response records reviewer/time.

**FR-S05 Help content.** The client shall provide readable FAQ/help content and access to the support form. Acceptance: a guest can reach a working help submission flow without a pre-existing account.

## 5 Business rules

**BR-01 Identity.** The token's verified user identifier, never a user-controlled body field, defines ownership of a newly submitted private record.

**BR-02 Status values.** Reservation states are pending, approved, rejected and cancelled. Pending/approved block overlapping slots; rejected/cancelled do not. Reviewers may change between the four existing status values. Reactivation to pending/approved must pass resource availability, future-interval and conflict checks within the same resource transaction. Owners use cancellation rather than editing status; changing the time of an approved request returns it to pending.

| Operation | Result | Guard |
| --- | --- | --- |
| Submit a new request | pending | Authenticated identity and atomic conflict check |
| Change timing | pending | Owner/admin, active record and validated future interval |
| Review or reopen | pending, approved, rejected or cancelled | Faculty/admin; no self-approval; active outcomes rechecked |
| Cancel | cancelled | Owner or admin |

**BR-03 Approval.** This baseline uses manual approval. Automatic faculty approval or resource-specific approval is not a completed workflow even though schema settings exist.

**BR-04 Time interpretation.** Booking input and stored DATETIME values use Asia/Colombo campus wall time, confirmed for this project. Offset-bearing ISO inputs are normalized to campus time. Database connections use +05:30, and API Date values serialize with an unambiguous offset/UTC representation. The reviewer screen explicitly displays Sri Lanka time. Existing stored booking values are preserved as campus wall times rather than shifted during migration.

**BR-05 Deletion.** Database foreign keys can cascade deletions of users/resources into reservations and related records. Administrators shall understand this before deleting a parent record. Retention/soft deletion policy remains to be agreed.

**BR-06 Policy configuration.** Working hours, advance-booking limits, minimum/maximum durations and recurring schedules shall not be presented as enforced rules until implemented and tested.

## 6 Data requirements

### 6.1 Core entities

| Entity | Essential data | Relationship |
| --- | --- | --- |
| users | id, name, unique email, password hash, role, department, phone, failure/lockout state | Owns reservations, support items and tokens |
| resources | id, name, type, building, location, capacity, description, status, images | Has many reservations |
| reservations | id, user_id, resource_id, start/end, purpose, notes, status, timestamps | Belongs to user and resource |
| notifications | id, user_id, title, message, type, related_type/id, read state/time | Belongs to recipient |
| feedback | id, user_id, category, subject, message, rating, status, response metadata | Belongs to submitter and optional responder |
| help_requests | id, nullable user_id, guest_email, topic, question, priority, status, response metadata | Account-linked or guest contact |
| password_reset_tokens | id, user_id, hashed token, expiry, used flag | Belongs to one user |

The full schema also contains schedules, favourites, audit/settings structures and additional resource/account metadata. Their presence shall not be treated as evidence of supported application features.

### 6.2 Integrity and privacy

Email addresses shall be unique. Foreign keys shall preserve referential integrity. Passwords shall be stored as hashes; reset tokens shall be hashed and expire. API responses shall omit password/token secrets. Query parameters shall be bound rather than interpolated into SQL. Image fields shall be parsed into a consistent collection for the client.

The institution shall approve retention periods for accounts, bookings, support records, logs and expired tokens. Production logs shall exclude reset links and unnecessary personal information. Backups shall be access controlled and restoration shall be tested before release.

## 7 External interfaces

### 7.1 Browser interface

The client shall offer public home/login/register/recovery pages; user dashboard, catalogue, booking/history/profile pages and a floating support panel; and administrator account/resource/booking/notification pages. Forms shall show validation results and clear loading/error feedback. Navigation shall preserve authentication expectations and make unauthorized actions inaccessible without relying on hiding controls alone.

### 7.2 API interface

The API shall use JSON requests/responses and bearer authorization for protected routes. The root namespaces are /api/auth, /api/resources, /api/reservations, /api/notifications, /api/feedback and /api/help. The README maintains the route index. Response outcomes shall distinguish 400 invalid input, 401 authentication failure, 403 authorization failure, 404 missing record, 409 booking conflict, 429 throttling and 500 unexpected failure.

List endpoints shall document filters, ordering and pagination behavior. Catalogue, reservation, user, feedback and help lists accept bounded limit/offset values. Limits must be 1 to 200 and offsets 0 to 1000000. Core catalogue/reservation/user endpoints default to 100 items; support defaults remain 10/20. Existing complete-list screens fetch bounded batches; support queues inside the floating panel show 20 items per page. Raw database/internal stack information shall not be exposed in production errors.

### 7.3 Services and deployment

MySQL is required for persistent state. SMTP is required for real password-reset delivery; a console fallback is suitable only for controlled local testing. Redis is optional and shall not become a dependency for correctness. The frontend API URL is a build-time setting. Express may serve a built client; production browser communication shall use HTTPS and an explicit allowed origin.

## 8 Nonfunctional requirements

These are proposed acceptance targets, not measured claims.

**NFR-01 Performance P1.** On an agreed test environment with 1,000 resources and 10,000 reservations, catalogue/list and availability API requests should achieve p95 below 1 second at 20 concurrent users, excluding cold startup and SMTP. Record environment, dataset, errors and latency distribution. Stakeholders must confirm this load profile before release.

**NFR-02 Correctness P1.** Concurrent booking tests shall preserve conflict integrity. Cache hits/misses and invalidation shall return equivalent authorized data. Cache failure shall not alter reservation correctness.

**NFR-03 Resource bounds P1.** The local response cache shall not exceed 500 entries; expired entries shall be reclaimed on access/write. Database pool limits and request body limits shall be explicit. Large unpaginated responses require capacity testing.

**NFR-04 Security P1.** Deployments shall use a non-default secret, HTTPS, validated inputs, role/ownership checks and appropriately configured rate limits. Reset-link logging, account enumeration, stale privileges and error disclosure shall be resolved or explicitly accepted by the owner before production.

**NFR-05 Usability P1.** At 360, 768 and 1440 CSS-pixel viewport widths, core forms/navigation shall remain operable without clipped actions. Booking conflicts and authorization errors shall provide understandable recovery guidance.

**NFR-06 Accessibility P1.** Core journeys shall support keyboard operation, visible focus, labelled controls, readable contrast and reduced-motion preferences. Confirm with manual keyboard/screen-reader checks and automated checks; no compliance certification is asserted here.

**NFR-07 Reliability P1.** Failed writes shall not report success. Unexpected API/database failures shall yield usable error feedback. A deployment health/readiness plan shall distinguish process liveness from database readiness.

**NFR-08 Maintainability P1.** Changes to business rules shall include focused regression tests. A release candidate shall pass backend tests, the client production build and the agreed browser/database acceptance cases. Dependencies and migration steps shall be reproducible.

**NFR-09 Recovery P1.** Operators shall document backup frequency, retention, recovery point and recovery time objectives and demonstrate one restoration. Numeric recovery/service availability commitments require institutional approval.

**NFR-10 Observability P2.** Operators should record useful request failures, rate-limit events, database availability and cache behavior without logging credentials or recovery secrets.

## 9 Primary use cases

### UC-01 Request a resource

Precondition: a student/faculty user is authenticated. The user browses the catalogue, selects a resource, chooses a valid interval and submits purpose/notes. The API checks identity, resource status, time validity and conflicts, then persists a pending request. The user sees the new request in personal history. Invalid input returns 400; a missing resource returns 404; an occupied slot returns 409. No failed request may create a reservation.

### UC-02 Review a request

Precondition: the reviewer has the required faculty/admin permission and access to a permitted review queue. The reviewer inspects resource/time/purpose, selects an allowed outcome and submits it. The API checks permission, state transition and conflicts, updates the record and creates an owner notification. Unauthorized or stale/conflicting decisions leave the request unchanged.

### UC-03 Recover an account

The user submits an email and receives a neutral response. If an account exists, the system creates a hashed, expiring reset record and sends its raw-token link using configured SMTP. The user opens the link, chooses a valid password and submits it. The token is validated and consumed as part of a consistent password change. Invalid/expired/reused links fail without changing the password.

### UC-04 Obtain help

A guest supplies email/topic/question, or a signed-in user supplies topic/question with a verified bearer token. The system creates an open request. Account-linked requests appear in the owner's history. A faculty/admin reviewer can respond and update status. Guest tracking beyond a contact email is not defined in the current interface baseline.

## 10 Verification and traceability

| Test ID | Requirement coverage | Acceptance method |
| --- | --- | --- |
| AT-01 | FR-A01 to FR-A03 | Register/login; reject invalid/admin registration; attempt private/admin routes as student |
| AT-02 | FR-A04 to FR-A08 | Lockout, profile role protection, password change, one-use reset and old-token invalidation |
| AT-03 | FR-R01, FR-B07 | Alternate filter values; repeat requests for cache hits; mutate and verify fresh lists |
| AT-04 | FR-R02 to FR-R05 | Resource CRUD/validation, missing images, status checks, popularity/statistics |
| AT-05 | FR-B01 to FR-B02 | Past/reversed/adjacent/overlapping intervals and concurrent conflicting submissions |
| AT-06 | FR-B03 to FR-B06 | Own/other ownership, partial edits, self-approval attempt, reviewer transitions, admin cancellation |
| AT-07 | FR-B08, FR-N01 to FR-N04 | Privacy of schedule output, notification generation, recipient isolation and refresh |
| AT-08 | FR-S01 to FR-S05 | Rating validation, feedback privacy, guest help, valid/invalid token help, reviewer response |
| AT-09 | NFR-01 to NFR-03 | Agreed load profile, cache bounds, DB pool behavior and error rate |
| AT-10 | NFR-04 to NFR-10 | Production config, mobile/keyboard checks, failed dependency behavior and restore exercise |

Automated regression coverage added during this review covers filter cache isolation/invalidation, local cache expiry/cardinality, SQL interval parameter ordering and guest/authenticated help routing. Eight focused regression tests cover cache behavior, authentication lifecycle, production secret checks, timestamp validation, pagination and help routing. A disposable-database acceptance suite verifies fresh/legacy upgrades, concurrent bookings, safe reactivation, cancellation, notifications, support, single-use password recovery and revoked sessions. Production-scale load, backup restoration and real SMTP delivery still require operational acceptance.

## 11 Implementation assessment and verification

### 11.1 Booking integrity and access

All booking writes run through one service. It locks the resource row before checking or changing reservations, serializing simultaneous requests for that resource. Creation, partial time edits, review/reactivation and cancellation apply identity and interval checks inside the transaction. Closed records cannot be edited through the generic edit path; owners cannot supply status/owner/resource changes. Administrator cancellation works for another owner's reservation. Schedule queries omit personal booking details.

### 11.2 Account and recovery safeguards

Protected requests verify current account state, role and token version. Password/role changes invalidate previous tokens; deleted/inactive accounts lose access. Production startup requires a non-default secret. Recovery responses use a neutral envelope for registered/unknown emails; reset links are never logged outside explicit local development opt-in. Reset issuance and token consumption use account locks and transactions. Failed-login counters update atomically.

### 11.3 Database and operational setup

Fresh and legacy schemas use a journaled migration runner with a migration lock and restartable existence checks. Schema upgrades retain rows and install insert/status notification triggers and query indexes. The startup launcher records only its own processes, never stops every Node process, and provides a corresponding stop option. Administrator/demo provisioning generates bcrypt hashes from operator-supplied passwords; invalid placeholder SQL utilities have been replaced.

### 11.4 Review and support interfaces

Faculty/admin users can review paginated bookings. Faculty/admin users can respond to help requests, and administrators can respond to feedback. Authenticated users can view their support history and staff responses. New screens have labelled controls, visible keyboard focus, mobile layouts and live error/loading feedback. The navigation menu is keyboard operable and updates its expanded state. Existing public/booking workflows remain in place.

### 11.5 Acceptance limits

Automated database tests use disposable databases rather than project records. A small-fixture 20-concurrent-request catalogue smoke check is included; it is not proof of the proposed 1000-resource/10000-booking performance target. A local database export was retained before upgrading the working database. Restoration, production SMTP, deployment-specific HTTPS/origin configuration, a full assistive-technology review and institutional retention/service-level decisions remain operational acceptance work. Dependency audit status and browser verification are recorded in the maintenance report.

## 12 Open decisions and approval

| Decision | Required owner | Outcome needed |
| --- | --- | --- |
| Faculty reviewer scope | Faculty resource owner | Global or assigned-resource reviews; permitted booking details |
| State changes after review | Resource owner and admin | Confirm transition matrix and rebooking policy |
| Operating rules | Institution | Hours, duration and advance limits; Asia/Colombo timezone is confirmed |
| Deletion and retention | Data owner | Retention periods, cascade policy and audit requirements |
| Production operation | Technical owner | Deployment secrets, SMTP, origin/HTTPS and monitoring |
| Capacity and recovery | Technical and operational owners | Approved load, backup, RPO/RTO and availability targets |
| Release acceptance | Project owner/test lead | Sign-off against AT-01 to AT-10 and unresolved gap disposition |

Approval shall establish the agreed requirements baseline; it shall not imply that unfinished requirements have been implemented. Proposed changes shall reference requirement IDs, identify affected data/API/UI behavior and include acceptance evidence.

## 13 Repository references

Implementation references: client/src/App.jsx; client/src/config/api.js; server/src/routes; server/src/controllers; server/src/models; server/src/middleware; server/src/config/database.js; server/src/config/cache.js; server/src/config/email.js; database/schema.sql; database/migrations; server/tests/cleanup.test.js; server/tests/security.test.js; server/tests/database.integration.js. The README provides setup instructions and the maintenance report records cleanup/verification details.
