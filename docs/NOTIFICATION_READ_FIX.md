# Notification read-state fix — 19 October 2026

The administrator notification page lists all users' notifications, while the former bulk-read endpoint only updated rows addressed to the signed-in administrator. The UI temporarily marked everything read locally, then restored unread rows on its next fetch.

The application now stores per-viewer read receipts. Both list endpoints return the viewer's effective read state, and bulk/single reads persist for exactly the visible scope. Existing owner read state is preserved for compatibility. Administrators reading the audit view do not mark recipients' inboxes read. Unknown and inaccessible individual notifications return 404.

The client shows saving state, prevents repeated bulk submissions, displays request failures, and reloads canonical read state after success. Fetch-version checks prevent stale polling responses from undoing the result.

Verified by database tests and browser tests: administrator and member state survives page reload, other users remain unread, repeated calls are idempotent, unauthorized writes are denied, and a simulated failed request is visible and retryable. Frontend lint and production build passed; focused backend tests passed. The working database migration was applied after a private backup. Restart the existing backend and refresh the frontend to load the updated code. Email settings were not changed.