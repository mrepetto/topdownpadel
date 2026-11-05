# GUI normalization — 2026-10-29

Training matches and Online Play now share the same two-team lineup editor: full-body portraits, central VS, left/right positions, character cycling, individual AI levels, and match format. Online hosts configure the roster; guests choose an open position and ready up. Existing room synchronization distributes the configuration.

Match formats: best of 3, 5 or 9 games, or a full best-of-three-set match with a 6–6 tiebreak. Golden point is retained. Match results offer Main Menu as well as replay/continuation. Club champions use uncropped full-body portraits; bracket statuses have their own row.

Verification: npm test passes, including shared-editor transitions, full-set/tiebreak scoring and result navigation visibility. Browser QA exercised training changes, a real host + guest room with synchronized roster/difficulty/duration, ready/start/leave, club portraits, bracket text, and 844×475 landscape fit.

Rollback: source version 79 (4f8d4dd60dadd289e1208fb8213c173aa18ba3d1) is the state before this pass. No shot physics or gesture mechanics changed.
