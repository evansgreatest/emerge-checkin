import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { firstName, lastName, phone, email, occupation, expectation, checkIn } = data

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'First name, last name, and phone number are required' },
        { status: 400 }
      )
    }

    // Check if attendee already exists by phone number
    const { data: existing } = await supabase
      .from('attendees')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    // Determine if we should check in (default to true for backward compatibility, false for online registration)
    const shouldCheckIn = checkIn !== false

    if (existing) {
      // Update existing attendee
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        email: email || existing.email,
        occupation: occupation || existing.occupation,
        expectation: expectation || existing.expectation,
      }

      // Only update check-in status if explicitly requested
      if (shouldCheckIn) {
        updateData.checked_in = true
        updateData.checked_in_at = new Date().toISOString()
      }

      const { data: attendee, error } = await supabase
        .from('attendees')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json(
          { error: 'Failed to update attendee' },
          { status: 500 }
        )
      }

      return NextResponse.json({ attendee, isNew: false }, { status: 200 })
    }

    // Create new attendee
    const insertData: any = {
      first_name: firstName,
      last_name: lastName,
      phone,
      email: email || null,
      occupation: occupation || null,
      expectation: expectation || null,
    }

    // Only check in if explicitly requested
    if (shouldCheckIn) {
      insertData.checked_in = true
      insertData.checked_in_at = new Date().toISOString()
    }

    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Create error:', error)
      return NextResponse.json(
        { error: 'Failed to create attendee' },
        { status: 500 }
      )
    }

    return NextResponse.json({ attendee, isNew: true }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register attendee' },
      { status: 500 }
    )
  }
}

