-- Enforces a single active login per user. Each login/register rotates
-- this value and embeds it in the issued JWT as the "sid" claim; a token
-- whose sid no longer matches the stored value is treated as superseded
-- (the account logged in elsewhere) and rejected on both REST and socket
-- authentication.
ALTER TABLE users ADD COLUMN session_id UUID NOT NULL DEFAULT gen_random_uuid();
