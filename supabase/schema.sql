-- Create attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  occupation TEXT,
  expectation TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_attendees_name ON attendees(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
CREATE INDEX IF NOT EXISTS idx_attendees_phone ON attendees(phone);
CREATE INDEX IF NOT EXISTS idx_attendees_checked_in ON attendees(checked_in);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_attendees_updated_at
  BEFORE UPDATE ON attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, adjust as needed)
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on attendees"
  ON attendees
  FOR ALL
  USING (true)
  WITH CHECK (true);

