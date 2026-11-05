# November store and navigation pass

Rollback source: d8420d024777a3c91c61aebdaba2693a75215b2e (published v166).

## Readability
Mobile-first is permanent project guidance in AGENTS.md. Challenge briefs use available height, large art, separated progress and coin rewards. Store content scrolls inside the game frame; section tabs and Back stay available. Approved character, item, coin and bag assets are reused at their native aspect ratios.

## Economy and preview pricing
Earned-coin purchases: existing racket and boost prices remain unchanged; featured skins use the same Career.skinPrice as Collection, preventing price inconsistencies. Three distinct characters (rare, epic, legendary) rotate deterministically every five days from 2026-01-01 UTC. Owned skins cannot be purchased again; stale rotations and insufficient funds are rejected. Locked-character skins remain cosmetics only and explicitly say the player is locked.

All EUR offers are preview concepts. Clicking them only shows Coming Soon; no currency, inventory, receipt or payment mutation.

| Tier | Bundle contents | Preview price |
| --- | --- | --- |
| Common | Common bag + 500 coins | €1.99 |
| Rare | Rare bag + 1,500 coins | €4.99 |
| Epic | Epic bag + 4,000 coins | €9.99 |
| Legendary | Legendary bag + 10,000 coins | €19.99 |

Coin-only packs: 500 / 3,000 / 7,000 / 16,000 at €0.99 / €4.99 / €9.99 / €19.99.
Bag-only packs: €0.99 / €2.99 / €5.99 / €12.99.
Halloween: epic bag + 2,500 coins, €6.99 preview vs planned €9.99 bundle (~30% reduction). This is explicitly a planned bundle price, not a claim of previous sales. Expires 30 November 2026 at midnight Europe/Madrid (2026-11-30T23:00Z). The card disappears after expiry, including while Store remains open.

Industry research, checked November 5, 2026: Tennis Clash's official US App Store lists $0.99, $1.99, $4.99 and $9.99 purchase points; its Spanish listing includes €0.99, €1.99 and €5.99. These inform familiar price steps, not an exchange-rate conversion. €19.99 is our proposed upper preview tier. Supercell's official shop documentation informed separating evergreen resources, bundles and featured offers.
- https://apps.apple.com/us/app/tennis-clash-sports-stars-game/id1346179411
- https://apps.apple.com/es/app/tennis-clash-juego-de-campe%C3%B3n/id1346179411
- https://support.clashroyale.com/hc/en-us/articles/49484889956251-Shop-Offers

## Verification
Regression coverage: direct charged campaign retry, paid resume/checkpoints, all campaign rungs, Back/Forward selection restoration, non-stacking store tabs, rules/settings/inventory overlays, 4 visible skin variants, item persistence, rotation boundaries, duplicate/expired skin purchases and seasonal expiry. Full npm test suite run. Browser checks cover portrait and landscape store and challenge layouts, collection advance, Back, Coming Soon and real earned-coin item purchase.
No device-native touch/IAP testing; IAP intentionally absent.

## Exclusive store art — 5 November follow-up
- Four individually illustrated bag-and-coin bundles, four bag-only illustrations, four coin-only treasure stacks, and one Halloween bag-and-coin illustration. Store art is independent of reward bag/inventory art. All 13 offer images are coherent compositions, not layered existing assets.
- Dedicated illustrated navy/teal/gold padel storefront icon on Home.
- All 14 exported assets are 640×640 alpha WebP, with transparent safety margins and contain scaling. Native PNG source artwork remains preserved in the generation outputs; optimized game assets are committed here.
- Insufficient coins now opens an accessible dialog with the exact missing balance and a Coin Store action. This applies to rackets, boosts, featured skins and Collection skin purchases. No charge or grant on failure. Back restores the underlying screen, skin and store scroll position.
- Real-money offers remain preview-only. Coin prices, item effects, campaign and gameplay are unchanged.
- Rollback baseline: v168 / 2f4764d7f4bcb02364b7d50ec235cb57bcbfa2c7.
- Validation: full game regression suite; focused store and navigation tests; visual inspection of all alpha assets; portrait and landscape browser review of offers, Home storefront, shortfall dialog and redirect/Back.

## Gold icon and countdown refinement
- Home storefront simplified into bold gold-only art, without a glass card. Brief wobble every 5.6 seconds; respects reduced-motion preferences.
- A separate static timer links directly to Coins & Offers. It counts down to the actual Halloween deadline (30 November 2026, 23:59 Madrid) rather than resetting per visit, and hides after expiry.
- Both blue-faced coin stack images replaced with gold-only art; cache-versioned URLs ensure returning users see the updates, including the insufficient-coins dialog.
- Asset edit prompts: `store-gold-art-prompts.json`. Existing offer layouts and gameplay preserved.
- Validated store countdown boundaries, purchase/navigation regression tests, portrait/landscape Home and corrected store art.

## Pro-shop icon refinement
- Replaced the ornate gold shop with a simple navy/gold padel racket and ball in front of a minimal shop awning. Dedicated transparent store-proshop-icon.webp.
- Icon reduced from 104px to 86px. Home offer block raised to 8.5% in portrait and 11% in landscape. Countdown, direct offer link and gentle wobble retained.
