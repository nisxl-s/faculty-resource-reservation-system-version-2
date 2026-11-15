# Normal-use request throttling — 19 October 2026

All server rate limits are unchanged, as explicitly requested.

Cause: the dashboard issued at least three reads every 30 seconds (about 90 requests per 15 minutes), nearly consuming the shared 100-request/IP budget by itself. Header components additionally prefetched several sections, duplicating the active page's requests. Notifications and other page visits then exhausted the remaining allowance.

Fixes: remove speculative navbar prefetching; keep on-demand page caches; poll visible dashboards and notification pages every two minutes; prevent overlapping requests; stop read requests during a 429 Retry-After interval; respect server headers before body fallback; show clean API messages on profile/notifications/dashboard instead of raw JSON or generic credential errors; preserve previously loaded dashboard totals after failures. A refresh may retry the server, but in-page navigation during a cooldown does not repeatedly hit the blocked API.

Verified with controlled browser responses: no duplicate dashboard request; hidden-tab polling suppressed; requests paused after 429; profile displays a clean error without another network request; pages recover when the restriction ends. Fast/slow loading behavior remains correct. Lint, build, focused backend tests and full database/browser regression suite were run.

A rate-limit increase was proposed, rejected by automatic approval review, then explicitly declined by the user. No limit, authentication protection, write protection, localhost bypass or test bypass was changed. An existing server cooldown remains until its normal expiry; this fix does not reset it. Multiple users or unusually heavy manual use can still reach the unchanged shared limit.