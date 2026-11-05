# Character art — illustrated pass

The gallery and lineup now use 16 illustrated transparent WebP assets generated with the built-in image generation tool, using the user's second attached concept as the style/anatomy reference. These are final shipped portrait assets, not animated sprite sheets.

## Integration

- Assets: `web/athlete-v2-*.webp`, 768 × 1152, WebP quality 88 with alpha preserved. Combined pack about 1.8 MB.
- `web/character-portraits.js` maps stable roster IDs to assets and defines per-character SVG headshot viewports. The gallery and lineup share the same art.
- `web/character-renderer.js` remains the articulated Canvas renderer. This pass improves muscle contours, soft lighting, jersey folds, collar, hands, and trainers. It does not animate or project the portrait bitmap onto the court.
- `scripts/build.mjs` embeds binary art safely. The Worker serves exact bytes with image/webp MIME, ETags, and lazy byte decoding. No external image host or runtime image service.
- Physics, roster identities, rankings, controller input and network snapshot formats remain unchanged. Idle paddle uses the existing edge-on overhead face.

## Production prompt set

Common brief: Production FULL BODY sports game character asset. Match the supplied concept's professional 2D painted illustration style, side-facing athletic ready stance, proportions, depth and volume. Change identity and uniform using the roster below. Navy shorts, white socks, substantial white trainers with kit-colored accents, white wristbands, solid black perforated short padel racket face and black wrist safety loop. Natural hands holding grip and throat in front, knees bent, body leans forwards, facing right. Premium athletic anatomy, expressive face and eyes, rounded skin shading, warm bounce light, rich cloth folds, detailed hair and footwear. Entire character and racket visible with margin, portrait 2:3, high resolution. Transparent isolated cutout. No background, glow, ground plane, caption or border. Accurate small jersey number. Avoid flat vector, polygonal forms, stiff skeletal limbs and plastic 3D.

Jeni was generated first with the additional instruction to retain her blonde high ponytail and black rectangular sports glasses. Martín, Laura and Rosalia used the same concept with a stronger request for nuanced gradients, modeled ears/nose/lips and layered folds. Remaining roster used the common brief above. Each character was generated in a separate call.

| Character | Number | Identity | Kit | Shipped asset |
|---|---|---|---|---|
| Cesar | 01 | White, bald, broad athletic build, short brown beard | ivory | [cesar](../web/athlete-v2-cesar.webp) |
| Quique | 02 | Tan skin, dark hair under an orange cap | orange | [quique](../web/athlete-v2-quique.webp) |
| Carlos | 03 | Medium brown skin, short black hair, lean build | turquoise | [carlos](../web/athlete-v2-carlos.webp) |
| Albert | 04 | White, bald, sturdy build, angular face, clean shaven | coral | [albert4](../web/athlete-v2-albert4.webp) |
| Jordi | 05 | Light warm skin, short brown hair and beard, broad build | lime | [jordi](../web/athlete-v2-jordi.webp) |
| Albert | 06 | White, bald, lean build, narrow face, clean shaven | purple | [albert6](../web/athlete-v2-albert6.webp) |
| Abel | 07 | Light peach skin, brown ponytail, clean shaven | yellow | [abel](../web/athlete-v2-abel.webp) |
| David | 08 | Light brown skin, short black hair, white headband | teal | [david](../web/athlete-v2-david.webp) |
| Jon | 09 | Medium brown skin, bald, neat dark stubble | blue | [jon](../web/athlete-v2-jon.webp) |
| Igor | 10 | Fair skin, dark hair under pink cap, broad build | rose | [igor](../web/athlete-v2-igor.webp) |
| Martín | 11 | Black, full black afro, strong athletic build | cyan | [martin](../web/athlete-v2-martin.webp) |
| Cristian | 12 | Light warm skin, black hair, glasses, white headband, short beard | taupe | [cristian](../web/athlete-v2-cristian.webp) |
| Xavi | 13 | Light tan skin, short brown hair, clean shaven | ice blue | [xavi](../web/athlete-v2-xavi.webp) |
| Jeni | 14 | White woman, blonde high ponytail, black rectangular glasses | lavender | [jeni](../web/athlete-v2-jeni.webp) |
| Laura | 15 | White woman, copper red ponytail, subtle freckles | mint | [laura](../web/athlete-v2-laura.webp) |
| Rosalia | 16 | White woman, black ponytail | pink | [rosalia](../web/athlete-v2-rosalia.webp) |

## Validation

Full npm regression suite passed: controls, menu navigation, all 16 portrait references, 640 rig poses with exact grip alignment and no player-state mutation, binary asset byte equality/MIME/HEAD/conditional caching, physics, five-minute match simulation, multiplayer rooms and relay performance. Browser QA covered desktop gallery, lineup, match launch and rendering, plus 390px mobile gallery with no horizontal overflow. Selecting a mobile roster card now scrolls back to the portrait.

