ALTER TABLE appointments ADD COLUMN started_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN finished_at TIMESTAMPTZ;

CREATE INDEX idx_appointments_started_at ON appointments(started_at);
CREATE INDEX idx_appointments_finished_at ON appointments(finished_at);
