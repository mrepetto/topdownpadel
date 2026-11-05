# Website responsive pass — 2026-11-05

Website-only changes in website.css and website.html. Game styles and artwork unchanged.

- Separated hero artwork and text at phone/tablet widths, retained close desktop framing.
- Centered phone portrait and kept full head in view.
- Stacked narrow section layouts, enlarged metadata and touch targets.
- Two-column skin buttons; horizontally scrolling galleries remain intentional.
- Responsive download badges, footer links, campaign art and facts.
- Shortened English primary CTA to PLAY BROWSER TEST to fit narrow phones.

Browser QA: 320px (English), 390px (English/Spanish), 768px tablet, 1024px landscape. Reviewed hero, roster, campaign, download/footer. Verified skin selection loads Martín Pit Crew. DOM text-fit checks excluded intentional offscreen carousel cards; no unexpected overflow found. Desktop styling above 1000px retained. Mobile viewport screenshot attached.

Rollback source: d74bf7f275261da46116743adb5bd38656288dd4 (version 176).
