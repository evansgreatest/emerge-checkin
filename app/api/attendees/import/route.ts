import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as any[]

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    // Normalize column names (handle various formats)
    const normalizeKey = (key: string) => {
      return key
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    const imported: any[] = []
    const errors: string[] = []

    // Log detected columns for debugging (first row only)
    if (data.length > 0) {
      const firstRow = data[0]
      const detectedColumns = Object.keys(firstRow)
      console.log('Detected columns:', detectedColumns)
      const normalizedKeys = Object.keys(firstRow).reduce((acc, key) => {
        acc[normalizeKey(key)] = key
        return acc
      }, {} as Record<string, string>)
      console.log('Normalized keys:', normalizedKeys)
    }

    // Process in batches to avoid memory issues
    const BATCH_SIZE = 100
    const totalBatches = Math.ceil(data.length / BATCH_SIZE)
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const start = batch * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, data.length)
      
      for (let i = start; i < end; i++) {
      const row = data[i]
      const keys = Object.keys(row).reduce((acc, key) => {
        acc[normalizeKey(key)] = key
        return acc
      }, {} as Record<string, string>)

      // Handle "Name" column (split into first and last name)
      let firstName = ''
      let lastName = ''
      
      if (row[keys.name]) {
        // Split name by space - first word is first name, rest is last name
        const nameParts = row[keys.name].toString().trim().split(/\s+/)
        if (nameParts.length > 0) {
          firstName = nameParts[0]
          lastName = nameParts.slice(1).join(' ') || nameParts[0] // If only one name, use it for both
        }
      }
      
      // Fallback to separate first/last name columns
      if (!firstName) {
        firstName = row[keys.firstname] || row[keys['firstname']] || row[keys.fname] || ''
      }
      if (!lastName) {
        lastName = row[keys.lastname] || row[keys['lastname']] || row[keys.lname] || ''
      }
      
      const email = row[keys.email] || row[keys.emailaddress] || row[keys.emailenteravalidemail] || null
      const phone = row[keys.phone] || row[keys.phonenumber] || row[keys.mobile] || ''
      const occupation = row[keys.occupation] || row[keys.job] || row[keys.title] || null
      const expectation = row[keys.expectation] || row[keys.expectations] || row[keys.yourexpectation] || null

      if (!firstName || !lastName || !phone) {
        const missingFields = []
        if (!firstName) missingFields.push('first name')
        if (!lastName) missingFields.push('last name')
        if (!phone) missingFields.push('phone number')
        errors.push(`Row ${i + 2}: Missing required fields (${missingFields.join(', ')})`)
        continue
      }

      try {
        // Check if attendee already exists by phone number
        const { data: existing, error: checkError } = await supabase
          .from('attendees')
          .select('*')
          .eq('phone', phone.toString())
          .maybeSingle()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine
          errors.push(`Row ${i + 2}: Error checking for existing attendee - ${checkError.message}`)
          continue
        }

        if (existing) {
          // Update existing
          const { data: attendee, error: updateError } = await supabase
            .from('attendees')
            .update({
              first_name: firstName.toString(),
              last_name: lastName.toString(),
              email: email?.toString().toLowerCase() || existing.email,
              occupation: occupation?.toString() || existing.occupation,
              expectation: expectation?.toString() || existing.expectation,
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (updateError) {
            errors.push(`Row ${i + 2}: ${updateError.message}`)
          } else if (attendee) {
            imported.push(attendee)
          }
        } else {
          // Create new
          const { data: attendee, error: createError } = await supabase
            .from('attendees')
            .insert({
              first_name: firstName.toString(),
              last_name: lastName.toString(),
              email: email?.toString().toLowerCase(),
              phone: phone.toString(),
              occupation: occupation?.toString(),
              expectation: expectation?.toString(),
            })
            .select()
            .single()

          if (createError) {
            errors.push(`Row ${i + 2}: ${createError.message}`)
          } else if (attendee) {
            imported.push(attendee)
          }
        }
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      } // End inner loop
    } // End batch loop

    return NextResponse.json(
      {
        imported: imported.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 50), // Limit to first 50 errors
        totalRows: data.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import file' },
      { status: 500 }
    )
  }
}

