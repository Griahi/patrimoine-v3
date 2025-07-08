import { NextRequest, NextResponse } from "next/server"
import { YahooFinanceService } from "@/lib/integrations/yahoo-finance"

const yahooFinanceService = new YahooFinanceService()

// GET: Search stock symbols
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: "Requête de recherche trop courte (minimum 2 caractères)" 
      }, { status: 400 })
    }

    const results = await yahooFinanceService.searchSymbols(query.trim())

    return NextResponse.json({
      success: true,
      results: results.slice(0, 10) // Limite à 10 résultats
    })

  } catch (error) {
    console.error('Yahoo Finance search error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la recherche de symboles" 
    }, { status: 500 })
  }
} 