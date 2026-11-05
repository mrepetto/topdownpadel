# Collection portraits · v3

Generated with the built-in image generation tool, one reference-based request per athlete. Original v2 art is retained for rollback and the compact on-court head crops. The articulated gameplay rig is unchanged.

## Files

Full-body portraits: `web/athlete-v3-<slug>.webp` (768 × 1152, alpha preserved). Collection thumbnails: `web/portrait-thumb-<slug>.webp` (256 × 256, individually framed). Rendering and bilingual personality copy: `web/character-portraits.js`.

| Character | Slug | Pose direction | Outfit direction |
|---|---|---|---|
| Cesar | cesar | Arms crossed, racket tucked under arm, calm captain | Pearl white, metallic gold, deep purple |
| Quique | quique | Tips orange cap, racket hanging by leg, mischievous smile | Tangerine and electric cobalt |
| Carlos | carlos | Inspects ball at eye level, racket by thigh | Cyan, acid lime, black chevrons |
| Albert | albert4 | Hand on hip, racket across shoulders, broad grin | Coral red sleeveless top, petrol teal, cream |
| Jordi | jordi | Laughing, thumbs up, racket lowered | Acid lime, hot pink, dark plum |
| Albert | albert6 | Crossed ankles, thoughtful chin gesture, upright racket | Violet and lemon yellow |
| Abel | abel | Adjusts high ponytail, relaxed twist | Sunflower yellow, turquoise, black brushstrokes |
| David | david | Tightens wrist tape, racket tucked under arm | Teal retro polo, coral and cream |
| Jon | jon | Small victorious fist pump, chin raised | Royal blue sleeveless top, orange tiger graphics |
| Igor | igor | Playful shrug, cap backwards, racket balanced at hip | Hot pink, aqua, violet, mismatched shoes |
| Martín | martin | Racket on shoulder, ball by hip | Electric cyan, hot magenta, neon yellow |
| Cristian | cristian | Adjusts glasses, thoughtful half smile | Cream, deep indigo, burnt orange |
| Xavi | xavi | Walking wave, racket carried loosely | Sky blue, sunset coral, white |
| Jeni | jeni | Peace sign, racket held by hip | Lavender, lime, purple athletic skort |
| Laura | laura | Racket salute, hand on hip | Mint teal, tangerine, navy |
| Rosalia | rosalia | Folded arms around vertical racket, crossed ankles | Hot pink, black, icy blue |

## Shared generation prompt

Create a replacement full-body 2D game collection portrait of the SAME padel athlete in the reference. Preserve recognizable face, skin color and hairstyle. Polished hand-painted/cel-shaded sports videogame concept art with fabric detail, strong readable silhouette, 3/4 side view with visible face. COMPLETELY NEW relaxed personality pose, NOT ready stance, no crouching. Entire figure including shoes centered with generous transparent padding on portrait canvas. Genuine transparent background, clean hard silhouette, NO glow, NO backdrop, NO floor, NO shadow ellipse. One person only, no text/numbers/logos. Solid padel racket with small holes, not strings. 

Each request appended the identity, pose and outfit direction above, preserving the matching `web/athlete-v2-<slug>.webp` reference. Explicit identity constraints: Cesar and both Alberts bald and fair; Jon bald with warm brown skin; Carlos short black hair; David light brown with white headband; Martín Black with large afro; Cristian fair with glasses; Jeni blonde with glasses; Laura copper-red hair; Rosalia fair with black hair. All three women were requested as adult athletes in credible sportswear.

Martín's initial prompt requested the same polished hand-painted/cel-shaded athlete, relaxed upright weight shift, perforated racket over shoulder, ball at hip, 3/4 side view, no crouching, whole figure, actual transparent background, no logos or text.

Only WebP encoding/downsampling and thumbnail framing followed generation. No changes to live character physics, stat modifiers, ownership, rewards or match rules.

## Interaction contract

- All 16 thumbnails remain visible in a 16:9 shell; owned, locked, inspected and equipped are separate states.
- Inspecting a thumbnail does not modify ownership or the default player.
- Equip is available only for owned characters and persists to the existing career save.
- An active tournament retains its original player and partner.
- Locked characters can be inspected in full colour and link to their earliest club.
- The equipped full-body portrait appears on the main menu, and personality portraits replace v2 full-body art in other menus.

## Validation

Automated coverage: all 48 legacy/new/thumbnail WebP files, MIME/cache/binary delivery, compact thumbnail budget, inspect/equip ownership guard, persistence, active tournament preservation, ES/EN copy and club navigation. Browser QA: desktop and 844 × 475 landscape, locked preview, owned equip and reload.

