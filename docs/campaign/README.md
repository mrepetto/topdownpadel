# Arcade campaign

Start with Xavi and a free club partner. Each of the 17 sections has three qualifiers and one collectible rival. Every match is one game with golden point at 40–40. Casual and Competitive track victories separately. Both share the wallet, pair, wardrobe and locker.

The authoritative rival order, sporting themes, difficulty and prices are in web/progression-core.js. The starting grant is 100 coins. Qualifiers cost 10 plus 3 per completed section, with another 10 for featured matches. Every attempt costs its displayed fee. Return Rally pays 25 coins for two legal returns in five feeds. Daily challenges pay 40, weekly challenges 100, and the weekly streak 125. Quick Play and Online are free exhibitions.

Conceding zero, one, two or three points yields Legendary, Epic, Rare or Common respectively. Only Legendary awards a skin. Eligible unowned tiers are weighted Rare 65, Epic 28 and Legendary 7. Weights are redistributed when a tier is exhausted. Hidden editions are excluded.

Save format v5 retains pre-campaign ownership, coins, inventory, equipped gear and history. An unfinished old paid entry is refunded once, and both modes begin at rung one. Existing owners of Cristian can clear his match in either mode. Paid campaigns checkpoint after each point and on mobile page suspension. A single saved profile write settles a win and queues its bag before showing the result.

Run with Node 24 using npm run dev. Run npm test for the gameplay, multiplayer, campaign and economy checks. Build using npm run build (both routes), npm run build:mobile or npm run build:desktop.

The two screenshots are rendered from the game in a 390 × 844 browser fixture with a fresh profile and an earned Cristian unlock.
