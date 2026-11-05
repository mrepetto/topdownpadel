# Swipe experiment rollback

Stable pre-swipe release: Sites version 48.
Source commit: 2cb053b04c9e1946078f1d1646e2b6c351d51e2c
Saved version ID: appgprj_6ae0811277988191b1d6ca371857a8f6~appgver_8e233f9344d481918b80b9a1aa9f8b65

Rollback by redeploying that saved version. It restores hold-to-charge, the current forgiving contacts, and best-of-three sets. Source is preserved in Git history.

Experiment: mouse drag direction and recent swipe speed determine aim/power, not time held. Mouse 1 drive, Mouse 2 lob. Keyboard/gamepad retain hold-charge as an accessible fallback. Pointer-lock movement accumulates during a gesture without clipping at screen edges. Release captures the gesture and preserves the physical contact buffer.

Official reference: https://tennisclash.zendesk.com/hc/en-gb/articles/12709842502929-How-do-I-hit-the-ball-with-different-intensities-and-styles
Tennis Clash describes fast, even short swipes for power. This prototype adapts that principle to padel; it does not reproduce its automatic movement or attribute system.
