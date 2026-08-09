-- Contact email and social links editable from Studio
ALTER TABLE profile ADD COLUMN email TEXT NOT NULL DEFAULT '';
ALTER TABLE profile ADD COLUMN instagram_url TEXT NOT NULL DEFAULT '';
ALTER TABLE profile ADD COLUMN artsy_url TEXT NOT NULL DEFAULT '';
ALTER TABLE profile ADD COLUMN pinterest_url TEXT NOT NULL DEFAULT '';
