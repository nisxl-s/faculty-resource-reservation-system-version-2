# Historical migrations

Files 001-004 are retained as historical references. Do not replay them against an existing installation.
Use npm --prefix server run migrate from the project root. The journaled runner checks missing columns and indexes, preserves rows and installs the canonical notification triggers. Fresh databases use npm --prefix server run db:setup. Back up existing data before upgrading. The canonical table and trigger definitions are in database/schema.sql.

## Resource details (20261018_02_resource_details)

The journaled runner adds nullable resources.details (JSON) and reservations.attendees (INT) without replacing existing rows. The canonical fresh-install schema includes both fields. Existing resource metadata is deliberately left unspecified until an administrator enters verified information. Venue metadata covers layout, floor area, facilities, accessibility and usage notes; equipment metadata covers model, asset reference, condition, specifications, accessories, collection and return instructions. Equipment listings remain exclusive single-asset/kit bookings; capacity is a seating limit only for spaces. No stock pooling or quantity splitting is introduced.

The API validates type-specific metadata and seating counts. Older API clients may omit details when updating an unchanged resource type; existing details are preserved. Date/time selection is shown in campus time (Asia/Colombo), with the server continuing to enforce valid future intervals and booking conflicts.
