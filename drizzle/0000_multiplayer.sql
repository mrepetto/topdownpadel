CREATE TABLE rooms (code TEXT PRIMARY KEY, host TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'lobby', snapshot TEXT, snapshot_seq INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE TABLE members (id TEXT PRIMARY KEY, room TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE, token_hash TEXT NOT NULL, name TEXT NOT NULL, slot INTEGER NOT NULL CHECK(slot BETWEEN 0 AND 3), ready INTEGER NOT NULL DEFAULT 0, seen INTEGER NOT NULL, input TEXT, offer TEXT, answer TEXT, UNIQUE(room,slot));
--> statement-breakpoint
CREATE INDEX members_room ON members(room);
