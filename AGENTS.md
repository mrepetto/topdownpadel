# Top Down Padel

Act as the main developer for Top Down Padel in the PADELMASTER project.

## Permanent mobile UI guidance
- Mobile-first readability is a product requirement. Keep labels near main-menu text size; never hide prices, rewards or actions in tiny copy. Shorten copy before shrinking fonts.
- Use the available screen: prominent art and coin rewards, generous padding, full-height menu content with scrolling when needed. Validate portrait AND landscape for clipping and legibility.
- Back returns exactly one meaningful screen and ultimately Home. Tabs, skin changes and selection changes replace state; they must not add Back steps.
- Real-money store is preview only until payments are explicitly implemented. No charges or grants from those offers.
- Text directly over illustrated menu backgrounds needs a subtle dark outline/shadow, as on the HUD. Challenge glass panels must retain enough opacity for readable labels; never sacrifice contrast for transparency.

## GitHub completion workflow
- GitHub `mrepetto/topdownpadel`, branch `main`, is the Mac/iPhone rebuild source. After each tested batch, reconcile with current main, commit and push, and verify the remote SHA. Website publication and GitHub synchronization are separate completion steps; report each truthfully.
- Preserve concurrent changes. Create a recoverable checkpoint before reconciling; never force-push or replace main with an older source snapshot. If main advances, fetch and reconcile again.
- Preserve shared `web/` sources, `native/` iOS/Android projects, build/sync scripts, lockfiles, `com.topdownpadel.game`, and existing signing settings. Never commit secrets, node_modules or ignored generated output.
- If access, tests or conflicts block completion, preserve work and report the exact blocker. Do not claim the repository is current without verifying it.
