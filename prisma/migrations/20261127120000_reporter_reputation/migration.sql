-- Reporter reputation: admins score reports when resolving them.
-- Valid reports reward the reporter; dismissed ones cost more than a valid
-- report earns, so a pattern of bad-faith reporting sinks below zero.
ALTER TABLE profiles ADD COLUMN reporter_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN good_reports INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN bad_reports INTEGER NOT NULL DEFAULT 0;
