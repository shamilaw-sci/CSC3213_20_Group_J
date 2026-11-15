-- Superseded by 20261115_security_performance.sql.
-- Historical inventory reservation state must be verified before migration.
DO $$ BEGIN RAISE EXCEPTION 'Use 20261115_security_performance.sql and its preflight checks; this migration is retired.'; END $$;
