# Quick Setup Guide

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (takes ~2 minutes)
3. Go to **Settings** > **API**
4. Copy your:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## 2. Database Setup

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## 3. Environment Variables

1. Create a file named `.env.local` in the root directory
2. Add these lines (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Run the Application

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5. Import Your Excel File

1. Click "Import Attendees" button
2. Select your Excel file
3. The system will automatically import all attendees

## Excel File Format

Your Excel file should have these columns (case-insensitive, variations accepted):

- **First Name** (or: Firstname, FName)
- **Last Name** (or: Lastname, LName)  
- **Email** (or: Email Address)
- **Phone** (optional, or: Phone Number, Mobile)
- **Occupation** (optional, or: Job, Title)
- **Expectation** (optional, or: Expectations)

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the root directory
- Check that the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after adding environment variables

### Import not working
- Make sure your Excel file has the required columns (First Name, Last Name, Email)
- Check the browser console for error messages
- Verify your Supabase RLS policies allow inserts (the schema.sql includes a permissive policy)

### Search not working
- Make sure you've run the SQL schema in Supabase
- Check that the `attendees` table exists in your Supabase database

