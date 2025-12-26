import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get total count
    const { count } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })

    // Get paginated attendees
    const { data: attendees, error } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('List error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch attendees' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json(
      {
        attendees: attendees || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('List error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}

