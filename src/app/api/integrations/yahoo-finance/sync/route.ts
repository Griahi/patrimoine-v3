import { NextRequest, NextResponse } from "next/server"
import { getToken } from "@/lib/auth"
import { YahooFinanceService } from "@/lib/integrations/yahoo-finance"

const yahooFinanceService = new YahooFinanceService()

// POST: Update stock prices
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userId = token.id as string
    const updateResult = await yahooFinanceService.updateStockPrices(userId)

    return NextResponse.json(updateResult)

  } catch (error) {
    console.error('Yahoo Finance sync error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la mise à jour des cours" 
    }, { status: 500 })
  }
}

// GET: Get current prices for symbols
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbolsParam = searchParams.get('symbols')
    
    if (!symbolsParam) {
      return NextResponse.json({ error: "Symboles manquants" }, { status: 400 })
    }

    const symbols = symbolsParam.split(',').filter(s => s.trim())
    if (symbols.length === 0) {
      return NextResponse.json({ error: "Aucun symbole valide" }, { status: 400 })
    }

    const prices = await yahooFinanceService.getCurrentPrices(symbols)

    return NextResponse.json({
      success: true,
      prices
    })

  } catch (error) {
    console.error('Yahoo Finance prices error:', error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des cours" 
    }, { status: 500 })
  }
} 