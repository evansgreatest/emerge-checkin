import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { firstName, lastName, phone } = data

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
      .single()

    if (existing) {
      // Update existing attendee and check them in
      const { data: attendee, error } = await supabase
        .from('attendees')
        .update({
          first_name: firstName,
          last_name: lastName,
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
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

    // Create new attendee and check them in
    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
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

