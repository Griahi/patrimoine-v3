/**
 * Yahoo Finance Service - Données Boursières
 * Alternative: Alpha Vantage, Finnhub, IEX Cloud
 */

import { prisma } from '@/lib/prisma'

interface YahooQuote {
  symbol: string
  regularMarketPrice: number
  currency: string
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketTime: number
  marketState: string
  regularMarketVolume: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketOpen: number
  regularMarketPreviousClose: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  marketCap: number
  shortName: string
  longName: string
  exchange: string
}

interface YahooHistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjclose: number
}

interface YahooSearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
  currency: string
}

interface StockPrice {
  symbol: string
  price: number
  currency: string
  change: number
  changePercent: number
  lastUpdate: Date
}

export class YahooFinanceService {
  private baseUrl: string
  private rapidApiKey: string
  private rapidApiHost: string
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes en millisecondes

  constructor() {
    // Utilisation de l'API RapidAPI pour Yahoo Finance
    this.baseUrl = 'https://yahoo-finance15.p.rapidapi.com'
    this.rapidApiKey = process.env.RAPIDAPI_KEY || ''
    this.rapidApiHost = 'yahoo-finance15.p.rapidapi.com'

    if (!this.rapidApiKey) {
      console.warn('Yahoo Finance API key is not configured')
    }
  }

  /**
   * Récupère les cours en temps réel pour une liste de symboles
   */
  async getQuotes(symbols: string[]): Promise<YahooQuote[]> {
    if (!this.rapidApiKey) {
      throw new Error('Yahoo Finance API key is not configured')
    }

    try {
      const symbolsString = symbols.join(',')
      const response = await fetch(`${this.baseUrl}/api/yahoo/qu/quote/${symbolsString}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.rapidApiHost
        }
      })

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : [data]
    } catch (error) {
      console.error('Yahoo Finance quotes error:', error)
      throw new Error('Failed to fetch quotes from Yahoo Finance')
    }
  }

  /**
   * Récupère les données historiques pour un symbole
   */
  async getHistoricalData(symbol: string, period = '1y'): Promise<YahooHistoricalData[]> {
    if (!this.rapidApiKey) {
      throw new Error('Yahoo Finance API key is not configured')
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/yahoo/hi/history/${symbol}?period=${period}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.rapidApiHost
        }
      })

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`)
      }

      const data = await response.json()
      return data.prices || []
    } catch (error) {
      console.error('Yahoo Finance historical data error:', error)
      throw new Error('Failed to fetch historical data from Yahoo Finance')
    }
  }

  /**
   * Recherche des symboles boursiers
   */
  async searchSymbols(query: string): Promise<YahooSearchResult[]> {
    if (!this.rapidApiKey) {
      throw new Error('Yahoo Finance API key is not configured')
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/yahoo/search/${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': this.rapidApiHost
        }
      })

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`)
      }

      const data = await response.json()
      return data.body || []
    } catch (error) {
      console.error('Yahoo Finance search error:', error)
      throw new Error('Failed to search symbols on Yahoo Finance')
    }
  }

  /**
   * Met à jour les cours des actions pour un utilisateur
   */
  async updateStockPrices(userId: string): Promise<{ success: boolean; message: string; updatedAssets: number }> {
    try {
      // Récupération des actifs actions de l'utilisateur
      const stockAssets = await prisma.asset.findMany({
        where: {
          assetType: {
            name: 'Actions et Parts Sociales'
          },
          ownerships: {
            some: {
              ownerEntity: {
                userId
              }
            }
          }
        },
        include: {
          assetType: true,
          valuations: {
            orderBy: { valuationDate: 'desc' },
            take: 1
          }
        }
      })

      if (stockAssets.length === 0) {
        return {
          success: true,
          message: 'Aucun actif action trouvé',
          updatedAssets: 0
        }
      }

      // Extraction des symboles boursiers
      const symbols = stockAssets
        .map(asset => asset.metadata?.symbol as string)
        .filter(symbol => symbol && symbol.length > 0)

      if (symbols.length === 0) {
        return {
          success: true,
          message: 'Aucun symbole boursier trouvé dans les actifs',
          updatedAssets: 0
        }
      }

      // Récupération des cours en temps réel
      const quotes = await this.getQuotes(symbols)
      let updatedAssets = 0

      // Mise à jour des valorisations
      for (const quote of quotes) {
        try {
          const asset = stockAssets.find(a => a.metadata?.symbol === quote.symbol)
          if (!asset) continue

          // Vérification si une mise à jour est nécessaire
          const lastValuation = asset.valuations[0]
          if (lastValuation) {
            const timeSinceLastUpdate = Date.now() - lastValuation.valuationDate.getTime()
            if (timeSinceLastUpdate < this.cacheTTL) {
              continue // Skip si mise à jour récente
            }
          }

          // Calcul de la valorisation totale
          const quantity = asset.metadata?.quantity as number || 1
          const totalValue = quote.regularMarketPrice * quantity

          // Création de la nouvelle valorisation
          await prisma.valuation.create({
            data: {
              assetId: asset.id,
              value: totalValue,
              currency: quote.currency,
              valuationDate: new Date(),
              source: 'YAHOO_FINANCE',
              metadata: {
                symbol: quote.symbol,
                pricePerShare: quote.regularMarketPrice,
                quantity: quantity,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                volume: quote.regularMarketVolume,
                marketCap: quote.marketCap
              }
            }
          })

          updatedAssets++
        } catch (error) {
          console.error(`Erreur lors de la mise à jour de l'actif ${quote.symbol}:`, error)
        }
      }

      return {
        success: true,
        message: `${updatedAssets} actifs mis à jour avec succès`,
        updatedAssets
      }

    } catch (error) {
      console.error('Stock prices update error:', error)
      return {
        success: false,
        message: 'Erreur lors de la mise à jour des cours',
        updatedAssets: 0
      }
    }
  }

  /**
   * Récupère les prix actuels avec mise en cache
   */
  async getCurrentPrices(symbols: string[]): Promise<StockPrice[]> {
    try {
      const quotes = await this.getQuotes(symbols)
      return quotes.map(quote => ({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        currency: quote.currency,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        lastUpdate: new Date(quote.regularMarketTime * 1000)
      }))
    } catch (error) {
      console.error('Get current prices error:', error)
      throw new Error('Failed to get current prices')
    }
  }

  /**
   * Synchronise les données historiques pour un actif
   */
  async syncHistoricalData(assetId: string, symbol: string, period = '1y'): Promise<{ success: boolean; message: string; recordsCreated: number }> {
    try {
      const historicalData = await this.getHistoricalData(symbol, period)
      let recordsCreated = 0

      for (const dataPoint of historicalData) {
        try {
          // Vérification si la donnée existe déjà
          const existingValuation = await prisma.valuation.findFirst({
            where: {
              assetId,
              valuationDate: new Date(dataPoint.date),
              source: 'YAHOO_FINANCE_HISTORICAL'
            }
          })

          if (!existingValuation) {
            await prisma.valuation.create({
              data: {
                assetId,
                value: dataPoint.close,
                currency: 'USD', // Par défaut, à adapter selon le symbole
                valuationDate: new Date(dataPoint.date),
                source: 'YAHOO_FINANCE_HISTORICAL',
                metadata: {
                  open: dataPoint.open,
                  high: dataPoint.high,
                  low: dataPoint.low,
                  close: dataPoint.close,
                  volume: dataPoint.volume,
                  adjclose: dataPoint.adjclose
                }
              }
            })
            recordsCreated++
          }
        } catch (error) {
          console.error(`Erreur lors de l'insertion de la donnée historique ${dataPoint.date}:`, error)
        }
      }

      return {
        success: true,
        message: `${recordsCreated} enregistrements historiques créés`,
        recordsCreated
      }

    } catch (error) {
      console.error('Sync historical data error:', error)
      return {
        success: false,
        message: 'Erreur lors de la synchronisation des données historiques',
        recordsCreated: 0
      }
    }
  }

  /**
   * Ajoute un nouveau symbole boursier au suivi
   */
  async addStockToPortfolio(userId: string, symbol: string, quantity: number = 1): Promise<{ success: boolean; message: string; assetId?: string }> {
    try {
      // Recherche d'informations sur le symbole
      const quotes = await this.getQuotes([symbol])
      if (quotes.length === 0) {
        return {
          success: false,
          message: 'Symbole boursier non trouvé'
        }
      }

      const quote = quotes[0]

      // Recherche du type d'actif "Actions et Parts Sociales"
      let assetType = await prisma.assetType.findFirst({
        where: { name: 'Actions et Parts Sociales' }
      })

      if (!assetType) {
        // Création du type d'actif s'il n'existe pas
        assetType = await prisma.assetType.create({
          data: {
            name: 'Actions et Parts Sociales',
            category: 'FINANCIAL',
            fields: {
              symbol: { type: 'string', label: 'Symbole', required: true },
              quantity: { type: 'number', label: 'Quantité', required: true },
              exchange: { type: 'string', label: 'Bourse', required: false },
              sector: { type: 'string', label: 'Secteur', required: false }
            }
          }
        })
      }

      // Recherche de l'entité utilisateur
      const userEntity = await prisma.entity.findFirst({
        where: { userId, type: 'INDIVIDUAL' }
      })

      if (!userEntity) {
        return {
          success: false,
          message: 'Entité utilisateur non trouvée'
        }
      }

      // Création de l'actif
      const asset = await prisma.asset.create({
        data: {
          name: quote.longName || quote.shortName || symbol,
          assetTypeId: assetType.id,
          metadata: {
            symbol: quote.symbol,
            quantity: quantity,
            exchange: quote.exchange,
            currency: quote.currency
          }
        }
      })

      // Création de la possession
      await prisma.assetOwnership.create({
        data: {
          assetId: asset.id,
          entityId: userEntity.id,
          percentage: 100
        }
      })

      // Création de la valorisation initiale
      const totalValue = quote.regularMarketPrice * quantity
      await prisma.valuation.create({
        data: {
          assetId: asset.id,
          value: totalValue,
          currency: quote.currency,
          valuationDate: new Date(),
          source: 'YAHOO_FINANCE',
          metadata: {
            symbol: quote.symbol,
            pricePerShare: quote.regularMarketPrice,
            quantity: quantity,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent
          }
        }
      })

      return {
        success: true,
        message: `Actif ${symbol} ajouté avec succès`,
        assetId: asset.id
      }

    } catch (error) {
      console.error('Add stock to portfolio error:', error)
      return {
        success: false,
        message: 'Erreur lors de l\'ajout de l\'actif'
      }
    }
  }

  /**
   * Calcule la performance d'un portefeuille
   */
  async calculatePortfolioPerformance(userId: string, period = '1y'): Promise<{ success: boolean; performance: number; message: string }> {
    try {
      const stockAssets = await prisma.asset.findMany({
        where: {
          assetType: {
            name: 'Actions et Parts Sociales'
          },
          ownerships: {
            some: {
              ownerEntity: {
                userId
              }
            }
          }
        },
        include: {
          valuations: {
            orderBy: { valuationDate: 'desc' },
            take: 2
          }
        }
      })

      if (stockAssets.length === 0) {
        return {
          success: true,
          performance: 0,
          message: 'Aucun actif action trouvé'
        }
      }

      let totalCurrentValue = 0
      let totalPreviousValue = 0
      let assetsWithData = 0

      for (const asset of stockAssets) {
        if (asset.valuations.length >= 2) {
          const currentValuation = asset.valuations[0]
          const previousValuation = asset.valuations[1]
          
          totalCurrentValue += currentValuation.value
          totalPreviousValue += previousValuation.value
          assetsWithData++
        }
      }

      if (assetsWithData === 0 || totalPreviousValue === 0) {
        return {
          success: true,
          performance: 0,
          message: 'Données insuffisantes pour calculer la performance'
        }
      }

      const performance = ((totalCurrentValue - totalPreviousValue) / totalPreviousValue) * 100

      return {
        success: true,
        performance: performance,
        message: `Performance calculée sur ${assetsWithData} actifs`
      }

    } catch (error) {
      console.error('Calculate portfolio performance error:', error)
      return {
        success: false,
        performance: 0,
        message: 'Erreur lors du calcul de la performance'
      }
    }
  }

  /**
   * Récupère les tendances du marché
   */
  async getMarketTrends(): Promise<{ success: boolean; trends: any[]; message: string }> {
    try {
      // Indices principaux à surveiller
      const majorIndices = ['%5EGSPC', '%5EDJI', '%5EIXIC', '%5EFCHI'] // S&P 500, Dow Jones, NASDAQ, CAC 40
      
      const quotes = await this.getQuotes(majorIndices)
      
      const trends = quotes.map(quote => ({
        symbol: quote.symbol,
        name: quote.shortName || quote.longName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        currency: quote.currency
      }))

      return {
        success: true,
        trends,
        message: 'Tendances du marché récupérées avec succès'
      }

    } catch (error) {
      console.error('Get market trends error:', error)
      return {
        success: false,
        trends: [],
        message: 'Erreur lors de la récupération des tendances du marché'
      }
    }
  }
} 