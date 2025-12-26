import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })

    // Get checked in count
    const { count: checkedInCount } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('checked_in', true)

    const total = totalCount || 0
    const checkedIn = checkedInCount || 0
    const notCheckedIn = total - checkedIn

    return NextResponse.json(
      {
        total,
        checkedIn,
        notCheckedIn,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

