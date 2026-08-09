-- Track failed Studio login attempts for simple IP rate limiting
CREATE TABLE IF NOT EXISTS auth_attempts (
  ip TEXT PRIMARY KEY,
  fails INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
