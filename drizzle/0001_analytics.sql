CREATE TABLE tdp_sessions (id TEXT PRIMARY KEY, device TEXT NOT NULL, started INTEGER NOT NULL, updated INTEGER NOT NULL, context TEXT NOT NULL, platform TEXT NOT NULL, language TEXT NOT NULL, version TEXT NOT NULL, internal INTEGER NOT NULL DEFAULT 0, active_ms INTEGER NOT NULL DEFAULT 0, gameplay_ms INTEGER NOT NULL DEFAULT 0, referrer TEXT NOT NULL DEFAULT '', campaign TEXT NOT NULL DEFAULT '');
CREATE INDEX tdp_sessions_started ON tdp_sessions(started);
CREATE INDEX tdp_sessions_device ON tdp_sessions(device, started);
CREATE TABLE tdp_events (id TEXT PRIMARY KEY, session TEXT NOT NULL REFERENCES tdp_sessions(id) ON DELETE CASCADE, kind TEXT NOT NULL, created INTEGER NOT NULL, mode TEXT NOT NULL DEFAULT '', label TEXT NOT NULL DEFAULT '', value REAL NOT NULL DEFAULT 0);
CREATE INDEX tdp_events_session ON tdp_events(session, created);
CREATE INDEX tdp_events_kind ON tdp_events(kind, created);
CREATE TABLE tdp_admin_sessions (token_hash TEXT PRIMARY KEY, expires INTEGER NOT NULL);
CREATE TABLE tdp_rate_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
