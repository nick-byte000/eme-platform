CREATE TABLE IF NOT EXISTS pending_otps (
  phone       VARCHAR(15) PRIMARY KEY,
  otp         VARCHAR(6)  NOT NULL,
  name        TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
