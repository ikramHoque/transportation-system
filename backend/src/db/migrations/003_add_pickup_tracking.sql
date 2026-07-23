-- Tracks how long a rider has been continuously near an active driver, so
-- the server can auto-clear their "waiting" flag once they've plausibly
-- boarded instead of relying on them remembering to press "Stop waiting".
-- NULL means "not currently near any driver".
ALTER TABLE locations ADD COLUMN near_driver_since TIMESTAMPTZ;
