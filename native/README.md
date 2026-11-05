# Top Down Padel mobile foundation

Shared game source: `../web`. Website builds and deployment remain at the repository root.
This is the first packaging milestone, not a store-ready app or validated device build.

## App identity

- Apple organization: Monster League SL
- Apple Team ID: HJJ8GD88JP
- Bundle ID / Android application ID: com.topdownpadel.game
- App Store Connect SKU: TDP-IOS-001
- App name: Top Down Padel

## Mac preparation

Install Xcode 26 or later supported by the Mac, including iOS components, and Node.js 22 or later.
Open Xcode, accept its license, complete component installation, then sign into the developer
Apple Account in Settings > Apple Accounts. Confirm Monster League SL appears.
Connect and trust the iPhone. Enable Developer Mode on the phone when prompted by Xcode.

## Open the generated native projects

The iOS and Android projects are already generated and tracked. From this directory:

```sh
npm ci
npm run sync
npm run open:ios
```

For later game updates:

```sh
npm run sync
npm run open:ios
```

In Xcode select the App target, choose Monster League SL, enable automatic signing, verify
the bundle ID, select the connected iPhone and Run. Actual compilation/signing requires macOS.
Android compilation requires Android Studio and its SDK. The existing root build:mobile script
is a hosted website layout build; this directory is the separate native packaging workflow.

## Outstanding work before device acceptance / TestFlight

- Final app icons, launch screens, supported orientations, signing and versioning.
- Bundle fonts locally (current game CSS imports Google Fonts).
- Configure multiplayer API origin and narrowly scoped backend CORS for native origins.
  Current relative /api requests cannot reach the hosted backend inside the app.
- Native persistence and lifecycle: pause/resume, audio interruptions, Android Back, safe areas.
- Safari localStorage saves do not transfer automatically to the installed app.
  Keep browser progress intact; agree an explicit export/import or account migration later.
- Verify campaign, training, collection, rewards, touch controls and save/relaunch on actual devices.
- Audit privacy declarations, SDK manifests, and any real-money purchases before store submission.

No remote server.url is configured: the game assets are bundled into the app.
Online services remain hosted. Desktop packaging can consume a separate shared-source static
build later; no Electron dependency is needed for this mobile milestone.
