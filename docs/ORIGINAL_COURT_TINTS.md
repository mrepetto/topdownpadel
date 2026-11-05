# Original court restored

Supersedes raster court integration described in CLUB_ART_ROLLBACK.md.
All modes use the original procedural court, including its original 1100×600 art bounds and camera framing. Only the turf gradient varies by club: Municipal green, Coast original blue, City violet, Glass terracotta, Arena grey, Masters burgundy. Net, markings, glass, geometry and gameplay are unchanged. Texture is regenerated only on palette changes and cached between frames.

Training selector, names, badges, HUD and v82 menu readability remain. The six padded raster backgrounds are removed from the deployed assets; approved source art remains archived separately.

Rollback baseline: v82 / b54401e3ad0123fc3110e7068d802d1dd4d24ea0.
QA: full regression suite passed, six palette/default/badge tests passed; browser verified Arena training selector, original geometry/framing and grey tint.
