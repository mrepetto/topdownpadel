# Product website and operations — 5 November 2026

Rollback source before website: ce2e66d838f485bc3deb1388cf6696b1bdebe2aa (live version 169 at opening). Local tag rollback-before-product-website-20261105. Restore that source/build if rollback is necessary; preserve later unrelated game changes.

Root is the product page. /game redirects to /game/ and serves the original game with a root asset base. /desktop and /mobile remain available. Keep game source in web/index.html and product content in web/website.html. Future game builds must preserve this separation. The manifest keeps its stable id / and updates start_url to /game/. Standalone visits to / are forwarded by the product page. Do not redirect www to apex: existing saves are origin-specific.

/generaladmin serves the login shell; all metrics APIs must enforce authentication. ADMIN_PASSWORD and ADMIN_SESSION_SECRET are runtime secrets, never committed. To rotate access, update both secrets through Sites and deploy. Admin is noindex and not linked in public navigation.

Video is the supplied 2 November recording, optimized to H.264/AAC with faststart and range responses. Replace web/gameplay.mp4 and its poster/screenshots when a newer trailer is approved. Existing video is an early build; screenshots should be labelled gameplay preview.

Store links are intentionally pending. Replace Coming soon only when actual listing URLs are available. Store clicks are not installs. Console/Steam badges indicate planned availability, not certification.

Analytics are opt-in, first party and pseudonymous. Historical metrics cannot be backfilled from browser-local saves. Verify the first accepted analytics batch and authenticated dashboard after publishing. Separate production and internal QA traffic. New store connections are a future phase.

Visual refresh rollback: 9d06f165b40d1e40356e440e1fae570c6c50c1ea (version 171), tag rollback-before-lively-website-20261105. Marketing-only change preserves game and analytics logic.
