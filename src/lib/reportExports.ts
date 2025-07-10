import { saveAs } from 'file-saver'
import { logger } from './logger'
import { secureExcelExport, securePDFExport, formatDataForExport } from './secure-export'

// Type pour html2pdf global
declare const html2pdf: any

// Dynamically import html2pdf pour éviter les erreurs SSR
const loadHtml2Pdf = async () => {
  if (typeof window === 'undefined') {
    logger.warn('html2pdf: Not available server-side', undefined, 'ReportExportService')
    return null
  }

  try {
    // Essayer d'abord le script global
    if (typeof (window as any).html2pdf !== 'undefined') {
      logger.info('html2pdf: Using global script', undefined, 'ReportExportService')
      return (window as any).html2pdf
    }
    
    // Sinon, essayer le CDN
    logger.info('html2pdf: Loading from CDN...', undefined, 'ReportExportService')
    
    // Charger html2pdf via CDN si pas déjà présent
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => {
        if (typeof (window as any).html2pdf !== 'undefined') {
          logger.info('html2pdf: Loaded successfully from CDN', undefined, 'ReportExportService')
          resolve((window as any).html2pdf)
        } else {
          reject(new Error('html2pdf not available after script load'))
        }
      }
      script.onerror = () => {
        reject(new Error('Failed to load html2pdf from CDN'))
      }
      document.head.appendChild(script)
    })
    
  } catch (error) {
    logger.error('html2pdf: Load error', error, 'ReportExportService')
    throw new Error('html2pdf library not available')
  }
}

interface ExportData {
  totalValue: number
  assetsByType: Record<string, {
    value: number
    count: number
    color: string
    percentage: number
  }>
  assets: Array<{
    id: string
    name: string
    assetType: { 
      id: string
      name: string 
      color?: string
    }
    valuations: Array<{ 
      value: number
      valuationDate: string
      currency: string 
    }>
    ownerships: Array<{
      percentage: number
      ownerEntity: {
        id: string
        name: string
        type: string
      }
    }>
    metadata?: any
  }>
  entities: Array<{
    id: string
    name: string
    type: string
  }>
  filters: {
    reportType: string
    period: string
    currency: string
    entities: string[]
  }
}

export class ReportExportService {
  
  /**
   * Vérifier la disponibilité des dépendances
   */
  static checkDependencies() {
    const status = {
      browser: typeof window !== 'undefined',
      exceljs: typeof secureExcelExport !== 'undefined',
      fileSaver: typeof saveAs !== 'undefined',
      html2pdf: false
    }
    
    // Ne pas vérifier html2pdf au chargement pour éviter les erreurs
    // La vérification se fera au moment de l'export PDF
    logger.info('Dependencies check:', status, 'ReportExportService')
    
    return status
  }

  /**
   * Export Excel sécurisé utilisant ExcelJS
   */
  static async exportToExcelSecure(data: ExportData, filename: string = 'rapport-patrimonial'): Promise<void> {
    try {
      logger.info('Démarrage export Excel sécurisé', { filename, assetsCount: data.assets.length }, 'ReportExportService')
      
      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined') {
        throw new Error('Export Excel disponible uniquement côté client')
      }

      // Formater les données pour l'export sécurisé
      const exportData = {
        sheets: [
          {
            name: 'Résumé',
            data: [
              {
                'Métrique': 'Patrimoine Total',
                'Valeur': data.totalValue.toString(),
                'Devise': data.filters.currency,
                'Date': new Date().toLocaleDateString('fr-FR')
              },
              {
                'Métrique': 'Nombre d\'actifs',
                'Valeur': data.assets.length.toString(),
                'Devise': '',
                'Date': new Date().toLocaleDateString('fr-FR')
              },
              {
                'Métrique': 'Types d\'actifs',
                'Valeur': Object.keys(data.assetsByType).length.toString(),
                'Devise': '',
                'Date': new Date().toLocaleDateString('fr-FR')
              }
            ],
            columns: [
              { header: 'Métrique', key: 'Métrique', width: 25 },
              { header: 'Valeur', key: 'Valeur', width: 15 },
              { header: 'Devise', key: 'Devise', width: 8 },
              { header: 'Date', key: 'Date', width: 15 }
            ]
          },
          {
            name: 'Répartition par type',
            data: Object.entries(data.assetsByType)
              .sort(([,a], [,b]) => b.value - a.value)
              .map(([type, typeData]) => ({
                'Type d\'actif': type,
                'Valeur': typeData.value.toString(),
                'Devise': data.filters.currency,
                'Pourcentage': `${typeData.percentage.toFixed(1)}%`,
                'Nombre d\'actifs': typeData.count.toString()
              })),
            columns: [
              { header: 'Type d\'actif', key: 'Type d\'actif', width: 25 },
              { header: 'Valeur', key: 'Valeur', width: 15 },
              { header: 'Devise', key: 'Devise', width: 8 },
              { header: 'Pourcentage', key: 'Pourcentage', width: 12 },
              { header: 'Nombre d\'actifs', key: 'Nombre d\'actifs', width: 15 }
            ]
          },
          {
            name: 'Détail des actifs',
            data: data.assets.map(asset => {
              const latestValuation = asset.valuations[0]
              return {
                'Nom de l\'actif': asset.name,
                'Type d\'actif': asset.assetType.name,
                'Valeur actuelle': (latestValuation?.value || 0).toString(),
                'Devise': latestValuation?.currency || data.filters.currency,
                'Date de valorisation': latestValuation?.valuationDate ? new Date(latestValuation.valuationDate).toLocaleDateString('fr-FR') : 'Non valorisé',
                'Statut': latestValuation ? 'Valorisé' : 'Non valorisé'
              }
            }),
            columns: [
              { header: 'Nom de l\'actif', key: 'Nom de l\'actif', width: 30 },
              { header: 'Type d\'actif', key: 'Type d\'actif', width: 20 },
              { header: 'Valeur actuelle', key: 'Valeur actuelle', width: 15 },
              { header: 'Devise', key: 'Devise', width: 8 },
              { header: 'Date de valorisation', key: 'Date de valorisation', width: 15 },
              { header: 'Statut', key: 'Statut', width: 12 }
            ]
          }
        ],
        filename: filename,
        title: 'Rapport Patrimonial',
        description: 'Données exportées depuis le gestionnaire de patrimoine'
      }

      // Ajouter la feuille des entités si multi-entités
      if (data.entities.length > 1) {
        exportData.sheets.push({
          name: 'Entités',
          data: data.entities.map(entity => {
            const entityAssetsCount = data.assets.filter(asset => 
              asset.ownerships && asset.ownerships.some(ownership => 
                ownership.ownerEntity.id === entity.id
              )
            ).length
            
            return {
              'Nom de l\'entité': entity.name,
              'Type d\'entité': entity.type === 'PHYSICAL_PERSON' ? 'Personne physique' : 'Personne morale',
              'Nombre d\'actifs détenus': entityAssetsCount.toString()
            }
          }),
          columns: [
            { header: 'Nom de l\'entité', key: 'Nom de l\'entité', width: 25 },
            { header: 'Type d\'entité', key: 'Type d\'entité', width: 18 },
            { header: 'Nombre d\'actifs détenus', key: 'Nombre d\'actifs détenus', width: 20 }
          ]
        })
      }

      // Exporter avec le service sécurisé
      await secureExcelExport.exportData(exportData)
      
      logger.info('Export Excel sécurisé terminé avec succès', undefined, 'ReportExportService')
      
      // Notification de succès
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success('Fichier Excel exporté avec succès (sécurisé)')
      }
      
    } catch (error) {
      logger.error('Erreur lors de l\'export Excel sécurisé', error, 'ReportExportService')
      
      // Message d'erreur plus informatif
      let errorMessage = 'Erreur lors de l\'export Excel sécurisé.'
      if (error instanceof Error) {
        errorMessage = `Erreur Excel: ${error.message}`
      }
      
      alert(errorMessage)
      
      // Notification d'erreur
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error(errorMessage)
      }
    }
  }
  
      /**
   * Export PDF sécurisé
   */
  static async exportToPDFSecure(
    elementId: string, 
    filename: string = 'rapport-patrimonial',
    reportTitle: string = 'Rapport Patrimonial',
    entityName?: string,
    subtitle?: string
  ): Promise<void> {
    try {
      logger.info('Démarrage export PDF sécurisé', { 
        elementId, 
        filename, 
        reportTitle, 
        entityName, 
        subtitle 
      }, 'ReportExportService')
      
      // Chargement html2pdf
      if (typeof window === 'undefined') {
        throw new Error('PDF côté client uniquement')
      }
      
      // Trouver l'élément RÉEL
      const element = document.getElementById(elementId)
      if (!element) {
        logger.error('Element non trouvé:', elementId, 'ReportExportService')
        throw new Error(`Élément '${elementId}' non trouvé`)
      }
      
      logger.info('Élément trouvé, utilisation du service d\'export PDF sécurisé', undefined, 'ReportExportService')
      
      // Préparer les options pour le service sécurisé
      const options = {
        title: reportTitle,
        entityName: entityName,
        subtitle: subtitle || `Généré le ${new Date().toLocaleDateString('fr-FR')}`
      }
      
      // Utiliser le service d'export PDF sécurisé avec les options
      await securePDFExport.exportElement(element, filename, options)
      
      logger.info('Export PDF sécurisé terminé avec succès', undefined, 'ReportExportService')
      
      // Notification
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success('PDF exporté avec succès (sécurisé)')
      }
      
    } catch (error) {
      logger.error('Erreur lors de l\'export PDF sécurisé', error, 'ReportExportService')
      alert(`Erreur: ${error instanceof Error ? error.message : 'PDF failed'}`)
    }
  }

  /**
   * Export en PDF - COPIE DE LA MÉTHODE D'IMPRESSION QUI FONCTIONNE (LEGACY)
   */
  static async exportToPDF(
    elementId: string, 
    filename: string = 'rapport-patrimonial.pdf',
    reportTitle: string = 'Rapport Patrimonial'
  ): Promise<void> {
    try {
      logger.info('Export PDF legacy', { elementId, filename, reportTitle }, 'ReportExportService')
      
      // Chargement html2pdf
      if (typeof window === 'undefined') {
        throw new Error('PDF côté client uniquement')
      }
      
      const html2pdf = await loadHtml2Pdf()
      if (!html2pdf) {
        throw new Error('html2pdf indisponible')
      }
      
      // Trouver l'élément RÉEL (comme dans printReport)
      const element = document.getElementById(elementId)
      if (!element) {
        logger.error('Element non trouvé:', elementId, 'ReportExportService')
        throw new Error(`Élément '${elementId}' non trouvé`)
      }
      
      logger.info('Élément trouvé, utilisation du contenu RÉEL', undefined, 'ReportExportService')
      
      // Utiliser la MÊME approche que printReport mais pour PDF
      // Créer un conteneur temporaire avec les styles d'impression
      const printContainer = document.createElement('div')
      printContainer.style.position = 'absolute'
      printContainer.style.left = '-9999px'
      printContainer.style.top = '0'
      printContainer.style.width = '800px'
      printContainer.style.backgroundColor = 'white'
      printContainer.style.fontFamily = 'Arial, sans-serif'
      printContainer.style.fontSize = '12px'
      printContainer.style.color = '#333'
      printContainer.style.padding = '20px'
      
      // Styles pour PDF (inspirés des styles d'impression qui fonctionnent)
      const pdfStyles = `
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000; background: white; }
          
          h1, h2, h3, h4, h5, h6 { margin-bottom: 10px; color: #333; font-weight: bold; }
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h3 { font-size: 16px; }
          p { margin-bottom: 8px; }
          
          .hidden, .no-print, button, .cursor-pointer, [role="button"] { display: none !important; }
          
          .card, .border { border: 1px solid #ddd !important; margin-bottom: 15px; padding: 12px; break-inside: avoid; background: white; }
          .grid { display: block !important; }
          .flex { display: block !important; }
          
          .text-sm { font-size: 11px !important; }
          .text-lg { font-size: 14px !important; }
          .text-xl { font-size: 16px !important; }
          .text-2xl { font-size: 18px !important; }
          .text-3xl { font-size: 20px !important; }
          
          .font-bold { font-weight: bold !important; }
          .font-medium { font-weight: 600 !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          
          .space-y-3 > * + * { margin-top: 12px; }
          .space-y-4 > * + * { margin-top: 16px; }
          .space-y-6 > * + * { margin-top: 24px; }
        </style>
      `
      
      // HTML pour le PDF (MÊME structure que printReport)
      const pdfHTML = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>${reportTitle}</title>
          ${pdfStyles}
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;">
            <h1>${reportTitle}</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          <div>
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `
      
      printContainer.innerHTML = pdfHTML
      document.body.appendChild(printContainer)
      
      logger.info('Génération PDF avec le contenu réel...', undefined, 'ReportExportService')
      
      // Configuration PDF optimisée
      const options = {
        margin: 15,
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      
      // Génération avec la méthode qui fonctionne
      html2pdf().set(options).from(printContainer).save()
      
      // Nettoyage
      setTimeout(() => {
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer)
        }
        logger.info('PDF généré!', undefined, 'ReportExportService')
      }, 2000)
      
      // Notification
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success('PDF exporté avec succès')
      }
      
    } catch (error) {
      logger.error('Erreur PDF:', error, 'ReportExportService')
      alert(`Erreur: ${error instanceof Error ? error.message : 'PDF failed'}`)
    }
  }



  /**
   * Export en Excel (redirects to secure method)
   */
  static exportToExcel(data: ExportData, filename: string = 'rapport-patrimonial.xlsx') {
    // Retirer l'extension .xlsx si présente pour la méthode sécurisée
    const baseFilename = filename.replace('.xlsx', '')
    
    // Utiliser la méthode sécurisée
    return this.exportToExcelSecure(data, baseFilename)
  }

  /**
   * Impression
   */
  static printReport(elementId: string, reportTitle: string = 'Rapport Patrimonial') {
    try {
      console.log('Démarrage impression...', { elementId, reportTitle })
      
      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined') {
        throw new Error('Impression disponible uniquement côté client')
      }

      const element = document.getElementById(elementId)
      if (!element) {
        console.error('Element non trouvé pour impression:', elementId)
        throw new Error(`Élément '${elementId}' non trouvé`)
      }

      console.log('Élément trouvé, création de la fenêtre d\'impression...')

      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloqués.')
      }

      // Styles optimisés pour l'impression
      const printStyles = `
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            padding: 15mm;
          }
          
          h1, h2, h3, h4, h5, h6 {
            margin-bottom: 10px;
            color: #333;
            font-weight: bold;
          }
          
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h3 { font-size: 16px; }
          h4 { font-size: 14px; }
          
          p {
            margin-bottom: 8px;
          }
          
          .card, .border {
            border: 1px solid #ddd !important;
            margin-bottom: 15px;
            padding: 12px;
            break-inside: avoid;
            background: white;
          }
          
          .grid {
            display: block !important;
          }
          
          .flex {
            display: block !important;
          }
          
          .text-sm {
            font-size: 11px !important;
          }
          
          .text-xs {
            font-size: 10px !important;
          }
          
          .text-lg {
            font-size: 14px !important;
          }
          
          .text-xl {
            font-size: 16px !important;
          }
          
          .text-2xl {
            font-size: 18px !important;
          }
          
          .text-3xl {
            font-size: 20px !important;
          }
          
          .font-bold {
            font-weight: bold !important;
          }
          
          .font-medium {
            font-weight: 600 !important;
          }
          
          .text-center {
            text-align: center !important;
          }
          
          .text-right {
            text-align: right !important;
          }
          
          .hidden,
          .no-print,
          button,
          .cursor-pointer,
          [role="button"] {
            display: none !important;
          }
          
          .space-y-3 > * + * {
            margin-top: 12px;
          }
          
          .space-y-4 > * + * {
            margin-top: 16px;
          }
          
          .space-y-6 > * + * {
            margin-top: 24px;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
          }
          
          @page {
            margin: 15mm;
            size: A4;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .avoid-break {
              break-inside: avoid;
            }
          }
        </style>
      `

      // HTML pour l'impression
      const printHTML = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${reportTitle}</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-header">
            <h1>${reportTitle}</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          <div class="content">
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `

      // Écrire le contenu dans la nouvelle fenêtre
      printWindow.document.write(printHTML)
      printWindow.document.close()

      console.log('Contenu écrit, préparation de l\'impression...')

      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          console.log('Lancement de l\'impression...')
          printWindow.focus()
          printWindow.print()
          
          // Fermer la fenêtre après impression (optionnel)
          setTimeout(() => {
            printWindow.close()
          }, 1000)
        }, 500)
      }

      // Fallback si onload ne se déclenche pas
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          console.log('Fallback: lancement de l\'impression...')
          printWindow.focus()
          printWindow.print()
        }
      }, 2000)

      console.log('Impression initiée avec succès')
      
      // Notification de succès
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success('Impression lancée')
      }

    } catch (error) {
      console.error('Erreur lors de l\'impression:', error)
      
      // Message d'erreur plus informatif
      let errorMessage = 'Erreur lors de l\'impression.'
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          errorMessage = 'Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les popups.'
        } else if (error.message.includes('Element')) {
          errorMessage = 'Contenu du rapport non trouvé. Veuillez actualiser la page.'
        } else {
          errorMessage = `Erreur impression: ${error.message}`
        }
      }
      
      alert(errorMessage)
      
      // Notification d'erreur
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error(errorMessage)
      }
    }
  }

  /**
   * Export en CSV
   */
  static exportToCSV(data: ExportData, filename: string = 'rapport-patrimonial.csv') {
    try {
      console.log('Démarrage export CSV...', { filename, assetsCount: data.assets.length })
      
      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined') {
        throw new Error('Export CSV disponible uniquement côté client')
      }

      // En-têtes du CSV
      const csvData = [
        ['Nom de l\'actif', 'Type d\'actif', 'Valeur actuelle', 'Devise', 'Date de valorisation', 'Statut', 'Propriétaires']
      ]

      // Données des actifs
      data.assets.forEach(asset => {
        const latestValuation = asset.valuations[0]
        
        // Construire la liste des propriétaires
        const owners = asset.ownerships 
          ? asset.ownerships.map(ownership => 
              `${ownership.ownerEntity.name} (${ownership.percentage}%)`
            ).join('; ')
          : 'Non défini'

        csvData.push([
          asset.name || 'Sans nom',
          asset.assetType?.name || 'Type non défini',
          (latestValuation?.value || 0).toString(),
          latestValuation?.currency || data.filters.currency,
          latestValuation?.valuationDate 
            ? new Date(latestValuation.valuationDate).toLocaleDateString('fr-FR') 
            : 'Non valorisé',
          latestValuation ? 'Valorisé' : 'Non valorisé',
          owners
        ])
      })

      // Ajouter des informations de résumé à la fin
      csvData.push([]) // Ligne vide
      csvData.push(['RÉSUMÉ DU RAPPORT'])
      csvData.push(['Patrimoine total', data.totalValue.toString(), data.filters.currency])
      csvData.push(['Nombre d\'actifs', data.assets.length.toString()])
      csvData.push(['Types d\'actifs', Object.keys(data.assetsByType).length.toString()])
      csvData.push(['Date de génération', new Date().toLocaleDateString('fr-FR')])
      csvData.push(['Heure de génération', new Date().toLocaleTimeString('fr-FR')])

      // Convertir en contenu CSV avec échappement proper
      const csvContent = csvData.map(row => 
        row.map(field => {
          // Échapper les guillemets doubles et entourer de guillemets
          const escapedField = String(field).replace(/"/g, '""')
          return `"${escapedField}"`
        }).join(',')
      ).join('\n')

      console.log('Contenu CSV généré, création du blob...')

      // Créer le blob avec BOM UTF-8 pour Excel
      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      })
      
      saveAs(blob, filename)
      
      console.log('CSV exporté avec succès')
      
      // Notification de succès
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success('Fichier CSV exporté avec succès')
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      
      // Message d'erreur plus informatif
      let errorMessage = 'Erreur lors de l\'export CSV.'
      if (error instanceof Error) {
        errorMessage = `Erreur CSV: ${error.message}`
      }
      
      alert(errorMessage)
      
      // Notification d'erreur
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error(errorMessage)
      }
    }
  }
} 