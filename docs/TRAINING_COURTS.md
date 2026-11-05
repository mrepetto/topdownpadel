# Training courts and club entry readability

Rollback: published v81, source `9ae49f5f45ce43e36fafd418f338bfca27147d69`, saved version `appgprj_6ae0811277988191b1d6ca371857a8f6~appgver_c1a28dd1e0fc81919d3df2b0d2bfeef6`.

Training Match setup offers all six courts regardless of career unlocks. The selection survives setup edits and returning to training within the session. Starting a career round restores its own club court; online and machine practice reset the venue. No entry fee or career rewards apply to training.

Club entry uses larger full-body featured rivals and concise English/Spanish copy. Prize calculations, gates, fees and rewards are unchanged.

QA: full npm test suite passed, including six court selections, training/career mode separation and online reset. Browser checked desktop club entry, 844×390 club entry, training court selector, and Arena training launch with matching surface/HUD badge.
