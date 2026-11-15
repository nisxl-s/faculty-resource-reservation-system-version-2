# USJ resource catalogue

USJ lists 11 faculties: https://www.sjp.ac.lk/about-2/ and https://international.sjp.ac.lk/ (checked 18 October 2026). Faculty names are official; room data for Computing was supplied by the owner. All other faculty rooms and campus shared inventory are marked as sample data.

## Structure

Faculty → venue → assigned equipment. Portable equipment retains an owning faculty and can be labelled campus shared. Each resource has a unique asset code, building, location, floor, status and sample flag. Venues require seating capacity; labs separately record computer count. Each equipment listing represents one independently bookable asset or kit.

Computing: ISH 01–09; ISH 07/09 seat 50, all others seat 20. ISH 01/02 and the lab are on the ground floor; ISH 03–09 are on the second floor. The lab has 100 computers, with 100 workstation/seating places assumed. RAAP Auditorium seats 200 and is outside the second floor. Each lecture hall and RAAP has its own projector listing. Two additional portable reserve projectors are provided per faculty. This interprets the reserve projectors as a faculty pool.

The other ten faculties each have two sample lecture halls, each with a sample assigned projector, plus two sample reserve projectors. Sample halls seat 30 and use a ground-floor/second-floor arrangement until actual data is available. Five campus shared sample items (laptop, portable speaker, microphone kit, camera and projection screen) are owned by Computing. Total: 88 resources (31 venues and 57 equipment listings).

## Administration

Use Manage Resources to choose a faculty, enter a unique asset code and select the floor. Choose a venue when assigning equipment; its building, floor and location are copied. Reassign equipment before changing a linked venue's location or faculty. Duplicate codes and invalid faculty/venue combinations are rejected by the API. A resource with booking history cannot be deleted; mark it unavailable. Equipment is booked separately from the room, and does not consume the room's booking calendar. Faculty ownership and campus sharing are catalogue classifications; the existing authenticated campus-wide booking policy remains in effect.

## Installation and preservation

Run npm --prefix server run catalog:configure once. It applies journaled schema migrations, writes a resource/reservation backup under .runtime/, archives the previous resources as unavailable and inserts the catalogue in a transaction. Reservation history is retained. Repeated execution is a no-op. Startup migrations change the schema only; they do not repeatedly replace inventory. The optional account seed no longer inserts an unstructured demo room.

## Validation

Backend unit tests cover exact seed quantities, capacities, floors and validation. Disposable database integration tests cover fresh/legacy upgrades, duplicate asset codes, parent/faculty consistency, safe deletion and booking concurrency. Set CATALOG_BROWSER_TESTS=true with PLAYWRIGHT_PACKAGE and BROWSER_EXECUTABLE to include catalogue browser checks at 1440, 768 and 360 pixels.

The launcher accepts -BackendPort and -FrontendPort for running alongside an existing session; the verified updated session uses 5001 and 3001.
