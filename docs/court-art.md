# Connected court enclosure

The approved enclosure uses a shallow, centered projection, shared by every panel, rail and post. The floor remains strictly top-down. Visual tops rise 10 court units per metre, with only a slight symmetric outward spread (`(x - 500) * height * .003`) to keep the end glass visible. There is no global sideways shear: glass uses 4 and mesh uses 3. Corner endpoints coincide, and short rail connectors close the stepped material transitions. These are art heights; existing ball collision rules remain unchanged.

Glass stays translucent and mesh detail is clipped to each panel. The entire court, including subtle seeded turf grain, is cached once on an offscreen canvas, without consuming gameplay randomness. The existing net and all playable floor coordinates are retained.

Validation: inspect all four corners, all four height transitions, glass transparency and player/ball readability in an actual match; run npm test before publication.
