ALTER TABLE expenses
ADD COLUMN user_id BIGINT
REFERENCES users(id)
ON DELETE CASCADE;

CREATE INDEX expenses_user_id_idx
ON expenses(user_id);