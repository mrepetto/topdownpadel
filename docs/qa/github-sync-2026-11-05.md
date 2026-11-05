# GitHub synchronization — 5 November 2026

Authoritative published source for this conversation: Sites version 177, commit `ba6e01449affb6b3a4ff8417ea7f093975a88b21`.
GitHub main before integration: `bfb5090b0dc2f84651e9e5c6695e8eb6f0111a24`.
Remote recovery branch: `backup/pre-website-sync-2026-11-05`.

Comparison found that GitHub already contained the corrected Martín portraits, skin assets, splash art, shared game source, and native projects. The missing completed work was the version 176–177 website crop and responsive layout plus its QA notes/screenshot. These files were integrated onto GitHub main rather than replacing it with the Sites snapshot. GitHub's newer README and ignore rules were preserved; README device status was updated to reflect Martín's reported successful iPhone build/run. AGENTS.md records the authorized synchronization workflow.

Checks passed: web build, website routes/assets, portrait asset checks (52), cosmetic checks (54 skins/108 assets), native packaging (272 game files), and whitespace checks. Native projects, scripts, root/native dependency manifests and lockfiles, bundle ID, and signing settings are byte-for-byte unchanged from pre-sync main. Generated dist/ and native/www/ remain ignored.

No new Xcode compilation or physical iPhone test was performed in this Linux environment. The website release was already published successfully as version 177; this synchronization does not republish or alter the installed iPhone app.
