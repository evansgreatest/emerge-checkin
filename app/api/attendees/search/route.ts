import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ attendees: [] }, { status: 200 });
    }

    const searchPattern = `%${query}%`;
    const queryParts = query.split(/\s+/).filter((part) => part.length > 0);
    const isFullName = queryParts.length > 1;

    // Search queries - execute them as promises
    const searchQueries = [
      // Search first name
      supabase
        .from("attendees")
        .select("*")
        .ilike("first_name", searchPattern)
        .limit(10),
      // Search last name
      supabase
        .from("attendees")
        .select("*")
        .ilike("last_name", searchPattern)
        .limit(10),
      // Search phone
      supabase
        .from("attendees")
        .select("*")
        .ilike("phone", searchPattern)
        .limit(10),
    ];

    // If query has multiple words, also search for first name + last name combination
    if (isFullName) {
      const firstNamePattern = `%${queryParts[0]}%`;
      const lastNamePattern = `%${queryParts.slice(1).join(" ")}%`;

      // Search for first word in first_name AND remaining words in last_name
      searchQueries.push(
        supabase
          .from("attendees")
          .select("*")
          .ilike("first_name", firstNamePattern)
          .ilike("last_name", lastNamePattern)
          .limit(10)
      );

      // Also try reverse (in case they typed "Last First")
      if (queryParts.length === 2) {
        searchQueries.push(
          supabase
            .from("attendees")
            .select("*")
            .ilike("first_name", `%${queryParts[1]}%`)
            .ilike("last_name", `%${queryParts[0]}%`)
            .limit(10)
        );
      }
    }

    const results = await Promise.all(searchQueries);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error(
        "Search errors:",
        errors.map((e) => e.error)
      );
      return NextResponse.json(
        { error: "Failed to search attendees" },
        { status: 500 }
      );
    }

    // Combine and deduplicate results
    const allResults = results.flatMap((result) => result.data || []);

    const uniqueResults = Array.from(
      new Map(allResults.map((item) => [item.id, item])).values()
    )
      .sort((a, b) => {
        const aName = `${a.last_name || ""} ${
          a.first_name || ""
        }`.toLowerCase();
        const bName = `${b.last_name || ""} ${
          b.first_name || ""
        }`.toLowerCase();
        return aName.localeCompare(bName);
      })
      .slice(0, 10);

    return NextResponse.json({ attendees: uniqueResults }, { status: 200 });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search attendees" },
      { status: 500 }
    );
  }
}
