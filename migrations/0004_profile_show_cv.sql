-- Public CV visibility (off by default)
ALTER TABLE profile ADD COLUMN show_cv INTEGER NOT NULL DEFAULT 0;
