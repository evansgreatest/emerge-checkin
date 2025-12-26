import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Attendee ID is required' },
        { status: 400 }
      )
    }

    const { data: attendee, error } = await supabase
      .from('attendees')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Check-in error:', error)
      return NextResponse.json(
        { error: 'Failed to check in attendee' },
        { status: 500 }
      )
    }

    return NextResponse.json({ attendee }, { status: 200 })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to check in attendee' },
      { status: 500 }
    )
  }
}

