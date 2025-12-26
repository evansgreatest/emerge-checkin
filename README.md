# Event Check-In System

A premium tablet-optimized event check-in system built with Next.js and Supabase.

## Features

- 📋 Import attendees from Excel/CSV files
- 🔍 Real-time search by name or email
- ✅ Quick check-in for registered attendees
- 📝 On-the-spot registration for walk-ins
- 📱 Tablet-optimized premium UI

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings > API
3. Copy your project URL and anon key
4. Run the SQL schema in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of supabase/schema.sql
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Importing Attendees

1. Click "Import Attendees" button
2. Select your Excel file (.xlsx, .xls, or .csv)
3. The system will automatically:
   - Detect column names (first name, last name, email, phone, occupation, expectation)
   - Import all attendees
   - Update existing attendees if email matches

### Checking In Attendees

1. Type the attendee's name or email in the search box
2. Select the attendee from the results
3. Click "Check In" to mark them as checked in

### Registering Walk-Ins

1. If an attendee is not found, click "Register New Attendee"
2. Fill in their information
3. They will be automatically checked in upon registration

## Excel File Format

Your Excel file should have columns for:
- First Name (or Firstname, FName)
- Last Name (or Lastname, LName)
- Email (or Email Address)
- Phone (or Phone Number, Mobile) - optional
- Occupation (or Job, Title) - optional
- Expectation (or Expectations) - optional

The system will automatically detect variations in column names.
# emerge-checkin
