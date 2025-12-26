import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ attendees: [] }, { status: 200 })
    }

    const searchPattern = `%${query}%`

    // Search each field separately and combine results (more reliable than .or())
    const [firstNameResults, lastNameResults, phoneResults] = await Promise.all([
      supabase.from('attendees').select('*').ilike('first_name', searchPattern).limit(10),
      supabase.from('attendees').select('*').ilike('last_name', searchPattern).limit(10),
      supabase.from('attendees').select('*').ilike('phone', searchPattern).limit(10),
    ])

    // Check for errors
    if (firstNameResults.error || lastNameResults.error || phoneResults.error) {
      console.error('Search errors:', {
        firstName: firstNameResults.error,
        lastName: lastNameResults.error,
        phone: phoneResults.error,
      })
      return NextResponse.json(
        { error: 'Failed to search attendees' },
        { status: 500 }
      )
    }

    // Combine and deduplicate results
    const allResults = [
      ...(firstNameResults.data || []),
      ...(lastNameResults.data || []),
      ...(phoneResults.data || []),
    ]
    
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.id, item])).values()
    )
    .sort((a, b) => {
      const aName = `${a.last_name || ''} ${a.first_name || ''}`.toLowerCase()
      const bName = `${b.last_name || ''} ${b.first_name || ''}`.toLowerCase()
      return aName.localeCompare(bName)
    })
    .slice(0, 10)

    return NextResponse.json({ attendees: uniqueResults }, { status: 200 })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search attendees' },
      { status: 500 }
    )
  }
}

