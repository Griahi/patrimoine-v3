import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Service de logging sécurisé
class Logger {
  private static isDev = process.env.NODE_ENV === 'development';
  
  static log(message: string, data?: any) {
    if (this.isDev) {
      console.log(`[SECURE-EXPORT] ${message}`, data);
    }
  }
  
  static error(message: string, error?: any) {
    if (this.isDev) {
      console.error(`[SECURE-EXPORT] ${message}`, error);
    }
  }
  
  static warn(message: string, data?: any) {
    if (this.isDev) {
      console.warn(`[SECURE-EXPORT] ${message}`, data);
    }
  }
}

// Interface pour les données d'export
interface ExportData {
  sheets: {
    name: string;
    data: any[];
    columns: { header: string; key: string; width?: number }[];
  }[];
  filename: string;
  title?: string;
  description?: string;
}

// Service d'export Excel sécurisé
class SecureExcelExport {
  private workbook: ExcelJS.Workbook;
  
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'Gestionnaire de Patrimoine';
    this.workbook.lastModifiedBy = 'Gestionnaire de Patrimoine';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
  }
  
  async exportData(data: ExportData): Promise<void> {
    try {
      Logger.log('Début export Excel sécurisé', { filename: data.filename });
      
      // Ajouter les feuilles
      for (const sheetData of data.sheets) {
        const worksheet = this.workbook.addWorksheet(sheetData.name);
        
        // Configurer les colonnes
        worksheet.columns = sheetData.columns;
        
        // Ajouter les données
        worksheet.addRows(sheetData.data);
        
        // Styles de base
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6F3FF' }
        };
        
        // Auto-ajuster la largeur des colonnes
        worksheet.columns.forEach(column => {
          if (!column.width) {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
              const cellLength = cell.value ? cell.value.toString().length : 0;
              if (cellLength > maxLength) {
                maxLength = cellLength;
              }
            });
            column.width = Math.min(Math.max(maxLength + 2, 10), 50);
          }
        });
      }
      
      // Générer le buffer
      const buffer = await this.workbook.xlsx.writeBuffer();
      
      // Créer et télécharger le fichier
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, `${data.filename}.xlsx`);
      Logger.log('Export Excel terminé avec succès');
      
    } catch (error) {
      Logger.error('Erreur lors de l\'export Excel', error);
      throw new Error('Échec de l\'export Excel sécurisé');
    }
  }
}

// Service d'export PDF sécurisé amélioré
class SecurePDFExport {
  private static readonly MAX_CANVAS_SIZE = 16384; // Augmenté pour les grandes pages
  
  async exportElement(
    element: HTMLElement, 
    filename: string, 
    options?: {
      title?: string;
      entityName?: string;
      subtitle?: string;
    }
  ): Promise<void> {
    try {
      Logger.log('=== DÉBUT EXPORT PDF SÉCURISÉ ===', { 
        filename, 
        elementId: element.id,
        title: options?.title,
        entityName: options?.entityName,
        elementVisible: element.offsetWidth > 0 && element.offsetHeight > 0,
        elementDimensions: {
          width: element.offsetWidth,
          height: element.offsetHeight,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight
        }
      });
      
      // Vérifier que l'élément est visible et a du contenu
      if (!element.offsetWidth || !element.offsetHeight) {
        Logger.error('Élément non visible ou vide', {
          offsetWidth: element.offsetWidth,
          offsetHeight: element.offsetHeight,
          clientWidth: element.clientWidth,
          clientHeight: element.clientHeight
        });
        throw new Error('Élément non visible ou vide pour l\'export PDF');
      }

      // Vérifier que l'élément a du contenu textuel
      const textContent = element.textContent || '';
      if (textContent.trim().length === 0) {
        Logger.error('Élément sans contenu textuel', { textLength: textContent.length });
        throw new Error('Élément sans contenu - impossible de générer le PDF');
      }

      Logger.log('Élément validé', { 
        textContentLength: textContent.length,
        childElementCount: element.childElementCount
      });

      // Essayer trois méthodes différentes
      let canvas: HTMLCanvasElement | null = null;
      let method = '';

      // Méthode 1: Directement sur l'élément
      try {
        Logger.log('Tentative méthode 1: Capture directe');
        canvas = await this.captureWithMethod1(element, options);
        method = 'direct';
      } catch (error) {
        Logger.warn('Méthode 1 échoué', error);
      }

      // Méthode 2: Avec conteneur temporaire si la méthode 1 échoue
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        try {
          Logger.log('Tentative méthode 2: Conteneur temporaire');
          canvas = await this.captureWithMethod2(element, options);
          method = 'container';
        } catch (error) {
          Logger.warn('Méthode 2 échoué', error);
        }
      }

      // Méthode 3: Capture simple si les autres échouent
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        try {
          Logger.log('Tentative méthode 3: Capture simple');
          canvas = await this.captureWithMethod3(element);
          method = 'simple';
        } catch (error) {
          Logger.warn('Méthode 3 échoué', error);
        }
      }

      // Vérifier le résultat final
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        Logger.error('Toutes les méthodes de capture ont échoué', {
          canvasExists: !!canvas,
          canvasWidth: canvas?.width || 0,
          canvasHeight: canvas?.height || 0
        });
        throw new Error('Impossible de capturer le contenu - toutes les méthodes ont échoué');
      }

      Logger.log('Capture réussie', { 
        method,
        canvasWidth: canvas.width, 
        canvasHeight: canvas.height 
      });

      // Vérifier que le canvas contient des données
      if (!this.canvasHasContent(canvas)) {
        Logger.error('Canvas capturé mais vide (pixels transparents)');
        throw new Error('Contenu capturé mais vide - vérifiez les styles CSS');
      }

      // Créer le PDF
      await this.createPDFFromCanvas(canvas, filename, options);
      
      Logger.log('=== EXPORT PDF TERMINÉ AVEC SUCCÈS ===');
      
    } catch (error) {
      Logger.error('=== ÉCHEC EXPORT PDF ===', error);
      throw new Error(`Échec de l'export PDF : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  private async captureWithMethod1(element: HTMLElement, options?: {
    title?: string;
    entityName?: string;
    subtitle?: string;
  }): Promise<HTMLCanvasElement> {
    Logger.log('Méthode 1: Capture directe avec styles optimisés');
    
    return await html2canvas(element, {
      scale: 1.2, // Légèrement augmenté pour une meilleure qualité
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        this.optimizeClonedDocument(clonedDoc, options);
      }
    });
  }

  private async captureWithMethod2(element: HTMLElement, options?: {
    title?: string;
    entityName?: string;
    subtitle?: string;
  }): Promise<HTMLCanvasElement> {
    Logger.log('Méthode 2: Conteneur temporaire');
    
    const container = await this.prepareElementForCapture(element, options);
    
    try {
      // Attendre que tout soit chargé
      await this.waitForElementsToLoad(container);
      
      const canvas = await html2canvas(container, {
        scale: 1.1, // Échelle optimisée pour le conteneur temporaire
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: Math.min(container.scrollWidth, this.MAX_CANVAS_SIZE),
        height: Math.min(container.scrollHeight, this.MAX_CANVAS_SIZE),
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          this.optimizeClonedDocument(clonedDoc, options);
        }
      });

      return canvas;
    } finally {
      // Nettoyer le conteneur temporaire
      if (container !== element && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  private async captureWithMethod3(element: HTMLElement): Promise<HTMLCanvasElement> {
    Logger.log('Méthode 3: Capture simple');
    
    return await html2canvas(element, {
      scale: 1,
      useCORS: false,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      removeContainer: false,
      onclone: (clonedDoc) => {
        // Styles très basiques pour forcer l'affichage
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * { color: #000 !important; background-color: #fff !important; }
          .hidden { display: block !important; }
          .invisible { visibility: visible !important; }
        `;
        clonedDoc.head.appendChild(style);
      }
    });
  }

  private canvasHasContent(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Vérifier quelques pixels pour voir s'ils ne sont pas tous transparents
    const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
    const data = imageData.data;

    // Chercher au moins un pixel non transparent
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) { // Canal alpha non nul
        return true;
      }
    }

    return false;
  }

  private async prepareElementForCapture(element: HTMLElement, options?: {
    title?: string;
    entityName?: string;
    subtitle?: string;
  }): Promise<HTMLElement> {
    // Créer un conteneur temporaire avec styles optimisés
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.4';
    container.style.padding = '20px';
    container.style.overflow = 'visible';
    container.style.minHeight = '100px';
    
    // Copier le contenu avec styles simplifiés
    const content = element.cloneNode(true) as HTMLElement;
    
    // Appliquer les styles d'optimisation
    this.applyPrintStyles(content, options);
    
    container.appendChild(content);
    document.body.appendChild(container);
    
    return container;
  }

  private applyPrintStyles(element: HTMLElement, options?: {
    title?: string;
    entityName?: string;
    subtitle?: string;
  }): void {
    // Styles pour forcer l'affichage de tous les éléments
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box !important;
        color: #000 !important;
        background-color: #fff !important;
      }
      
      .hidden,
      .no-print {
        display: block !important;
        visibility: visible !important;
      }
      
      button,
      .cursor-pointer,
      [role="button"] {
        display: none !important;
      }
      
      .grid,
      .flex {
        display: block !important;
      }
      
      .absolute,
      .fixed,
      .sticky {
        position: static !important;
      }
      
      .overflow-hidden,
      .overflow-auto,
      .overflow-scroll {
        overflow: visible !important;
      }
      
      .card,
      .border {
        border: 1px solid #ddd !important;
        background: white !important;
        margin-bottom: 15px !important;
        padding: 15px !important;
        display: block !important;
        page-break-inside: avoid !important;
      }
      
      .shadow,
      .shadow-sm,
      .shadow-md,
      .shadow-lg {
        box-shadow: none !important;
      }
      
      .rounded,
      .rounded-sm,
      .rounded-md,
      .rounded-lg {
        border-radius: 0 !important;
      }
      
      .transform {
        transform: none !important;
      }
      
      .transition {
        transition: none !important;
      }
      
      .animate-spin,
      .animate-pulse {
        animation: none !important;
      }
      
      /* Forcer l'affichage des graphiques */
      .recharts-wrapper,
      .recharts-surface {
        display: block !important;
        width: 100% !important;
        height: 300px !important;
        background: #f0f0f0 !important;
      }
      
      svg {
        width: 100% !important;
        height: auto !important;
        background: #f0f0f0 !important;
      }
      
      canvas {
        width: 100% !important;
        height: auto !important;
        background: #f0f0f0 !important;
      }
      
      /* Améliorer la taille et lisibilité du texte */
      h1, h2, h3, h4, h5, h6, p, span, div {
        display: block !important;
        visibility: visible !important;
        color: #000 !important;
        opacity: 1 !important;
        font-family: 'Segoe UI', Arial, sans-serif !important;
        line-height: 1.4 !important;
        margin-bottom: 8px !important;
      }
      
      /* Tailles de police améliorées */
      h1 {
        font-size: 28px !important;
        font-weight: bold !important;
        margin-bottom: 15px !important;
        text-align: center !important;
        padding-bottom: 10px !important;
        border-bottom: 2px solid #333 !important;
      }
      
      h2 {
        font-size: 22px !important;
        font-weight: bold !important;
        margin: 20px 0 12px 0 !important;
        color: #333 !important;
      }
      
      h3 {
        font-size: 18px !important;
        font-weight: 600 !important;
        margin: 15px 0 10px 0 !important;
        color: #555 !important;
      }
      
      h4 {
        font-size: 16px !important;
        font-weight: 600 !important;
        margin: 12px 0 8px 0 !important;
      }
      
      p, span, div {
        font-size: 14px !important;
        line-height: 1.5 !important;
        margin-bottom: 6px !important;
      }
      
      /* Styles pour les métriques importantes */
      .text-3xl {
        font-size: 32px !important;
        font-weight: bold !important;
        color: #000 !important;
      }
      
      .text-2xl {
        font-size: 26px !important;
        font-weight: bold !important;
      }
      
      .text-xl {
        font-size: 20px !important;
        font-weight: 600 !important;
      }
      
      .text-lg {
        font-size: 18px !important;
      }
      
      .text-sm {
        font-size: 13px !important;
      }
      
      .text-xs {
        font-size: 12px !important;
      }
      
      /* Améliorer l'affichage des tableaux */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 10px 0 !important;
        font-size: 13px !important;
      }
      
      th, td {
        border: 1px solid #ddd !important;
        padding: 8px !important;
        text-align: left !important;
        font-size: 13px !important;
      }
      
      th {
        background-color: #f5f5f5 !important;
        font-weight: bold !important;
      }
      
      /* Espacements */
      .space-y-6 > * + * {
        margin-top: 24px !important;
      }
      
      .space-y-4 > * + * {
        margin-top: 16px !important;
      }
      
      .space-y-3 > * + * {
        margin-top: 12px !important;
      }
      
      /* Éviter les coupures de page dans les sections importantes */
      .avoid-break {
        page-break-inside: avoid !important;
      }
    `;
    
    element.insertBefore(style, element.firstChild);
  }

  private async waitForElementsToLoad(container: HTMLElement): Promise<void> {
    // Attendre le chargement des images
    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Résoudre même en cas d'erreur
          setTimeout(() => resolve(), 2000); // Timeout de 2 secondes
        }
      });
    });
    
    // Attendre les graphiques et éléments dynamiques
    await Promise.all([
      ...imagePromises,
      new Promise(resolve => setTimeout(resolve, 500)) // Délai réduit
    ]);
  }

  private optimizeClonedDocument(clonedDoc: Document, options?: {
    title?: string;
    entityName?: string;
    subtitle?: string;
  }): void {
    // Supprimer les scripts
    const scripts = clonedDoc.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Supprimer les éléments problématiques
    const problematicElements = clonedDoc.querySelectorAll('noscript, iframe, object, embed');
    problematicElements.forEach(element => element.remove());
    
    // Ajouter des styles globaux pour forcer l'affichage
    const style = clonedDoc.createElement('style');
    style.textContent = `
      * { 
        color: #000 !important; 
        background-color: transparent !important; 
        font-family: Arial, sans-serif !important;
      }
      body { 
        background-color: #ffffff !important; 
        color: #000000 !important; 
        font-size: 12px !important;
      }
      .hidden { display: block !important; }
      .invisible { visibility: visible !important; }
      .opacity-0 { opacity: 1 !important; }
      .text-transparent { color: #000 !important; }
    `;
    clonedDoc.head.appendChild(style);

    // Ajouter le titre de la page si disponible
    if (options?.title) {
      const titleStyle = clonedDoc.createElement('style');
      titleStyle.textContent = `
        .page-title {
          text-align: center;
          font-size: 28px !important;
          font-weight: bold;
          margin: 20px 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #333;
          color: #000 !important;
        }
      `;
      clonedDoc.head.appendChild(titleStyle);

      const titleElement = clonedDoc.createElement('div');
      titleElement.className = 'page-title';
      titleElement.textContent = options.title;
      
      // Insérer au début du body
      if (clonedDoc.body.firstChild) {
        clonedDoc.body.insertBefore(titleElement, clonedDoc.body.firstChild);
      } else {
        clonedDoc.body.appendChild(titleElement);
      }
    }

    // Ajouter le nom de l'entité si disponible
    if (options?.entityName) {
      const entityNameStyle = clonedDoc.createElement('style');
      entityNameStyle.textContent = `
        .entity-name {
          text-align: center;
          font-size: 16px !important;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #555 !important;
          background-color: #f8f9fa !important;
          padding: 8px 15px;
          border-radius: 5px;
          display: inline-block;
          border: 1px solid #dee2e6;
        }
        .entity-container {
          text-align: center;
          margin-bottom: 20px;
        }
      `;
      clonedDoc.head.appendChild(entityNameStyle);

      const entityContainer = clonedDoc.createElement('div');
      entityContainer.className = 'entity-container';
      
      const entityNameElement = clonedDoc.createElement('div');
      entityNameElement.className = 'entity-name';
      entityNameElement.textContent = options.entityName;
      
      entityContainer.appendChild(entityNameElement);
      
      // Insérer après le titre s'il existe, sinon au début
      const titleElement = clonedDoc.querySelector('.page-title');
      if (titleElement && titleElement.nextSibling) {
        clonedDoc.body.insertBefore(entityContainer, titleElement.nextSibling);
      } else if (titleElement) {
        titleElement.after(entityContainer);
      } else if (clonedDoc.body.firstChild) {
        clonedDoc.body.insertBefore(entityContainer, clonedDoc.body.firstChild);
      } else {
        clonedDoc.body.appendChild(entityContainer);
      }
    }

    // Ajouter le sous-titre si disponible
    if (options?.subtitle) {
      const subtitleStyle = clonedDoc.createElement('style');
      subtitleStyle.textContent = `
        .subtitle {
          text-align: center;
          font-size: 12px !important;
          color: #777 !important;
          margin: 0 0 25px 0;
          font-style: italic;
        }
      `;
      clonedDoc.head.appendChild(subtitleStyle);

      const subtitleElement = clonedDoc.createElement('div');
      subtitleElement.className = 'subtitle';
      subtitleElement.textContent = options.subtitle;
      
      // Insérer après l'entité ou le titre
      const entityContainer = clonedDoc.querySelector('.entity-container');
      const titleElement = clonedDoc.querySelector('.page-title');
      
      if (entityContainer) {
        entityContainer.after(subtitleElement);
      } else if (titleElement) {
        titleElement.after(subtitleElement);
      } else if (clonedDoc.body.firstChild) {
        clonedDoc.body.insertBefore(subtitleElement, clonedDoc.body.firstChild);
      } else {
        clonedDoc.body.appendChild(subtitleElement);
      }
    }
  }

  private async createPDFFromCanvas(canvas: HTMLCanvasElement, filename: string, options?: {
    title?: string;
    entityName?: string;
    subtitle?: string;
  }): Promise<void> {
    Logger.log('Création du PDF à partir du canvas', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    });

    // Paramètres PDF améliorés
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // ~210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // ~297mm
    const margin = 10; // Marges de 10mm
    const contentWidth = pageWidth - (2 * margin);
    const contentHeight = pageHeight - (2 * margin);
    
    // Ajouter une page de titre si des informations sont fournies
    if (options?.title || options?.entityName) {
      this.addTitlePage(pdf, options, margin, pageWidth, pageHeight);
      pdf.addPage(); // Nouvelle page pour le contenu
    }
    
    // Convertir le canvas en image
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    Logger.log('Image générée', {
      dataUrlLength: imgData.length,
      isEmptyImage: imgData === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    });
    
    // Vérifier que l'image n'est pas vide
    if (imgData === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' || imgData.length < 100) {
      throw new Error('Image capturée vide - contenu non visible');
    }
    
    // Calculer les dimensions pour s'adapter à la page avec les marges
    const imgAspectRatio = canvas.width / canvas.height;
    let imgWidth = contentWidth;
    let imgHeight = contentWidth / imgAspectRatio;
    
    // Si l'image est trop haute, ajuster en fonction de la hauteur
    if (imgHeight > contentHeight) {
      imgHeight = contentHeight;
      imgWidth = contentHeight * imgAspectRatio;
    }
    
    // Centrer l'image horizontalement si elle est plus petite que la largeur
    const xOffset = margin + (contentWidth - imgWidth) / 2;
    let yOffset = margin;
    
    Logger.log('Dimensions PDF calculées', {
      imgWidth,
      imgHeight,
      xOffset,
      yOffset,
      contentHeight,
      pageHeight,
      nbPages: Math.ceil(imgHeight / contentHeight)
    });
    
    // Si l'image tient sur une seule page
    if (imgHeight <= contentHeight) {
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      Logger.log('Image ajoutée sur une seule page');
    } else {
      // L'image nécessite plusieurs pages
      let remainingHeight = imgHeight;
      let sourceY = 0;
      let pageNum = 1;
      
      while (remainingHeight > 0) {
        // Hauteur à afficher sur cette page
        const pageImageHeight = Math.min(remainingHeight, contentHeight);
        
        // Calculer la portion du canvas source
        const sourceHeight = (pageImageHeight / imgHeight) * canvas.height;
        
        // Créer un canvas temporaire pour cette portion
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          // Copier la portion correspondante du canvas original
          tempCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight, // Source
            0, 0, canvas.width, sourceHeight        // Destination
          );
          
          // Convertir en image
          const tempImgData = tempCanvas.toDataURL('image/png', 1.0);
          
          // Ajouter au PDF (ajouter une page seulement si ce n'est pas la première)
          if (pageNum > 1 || options?.title || options?.entityName) {
            pdf.addPage();
          }
          
          pdf.addImage(tempImgData, 'PNG', xOffset, yOffset, imgWidth, pageImageHeight);
          
          Logger.log(`Page ${pageNum} ajoutée`, {
            sourceY,
            sourceHeight,
            pageImageHeight,
            remainingHeight
          });
        }
        
        // Préparer pour la page suivante
        sourceY += sourceHeight;
        remainingHeight -= pageImageHeight;
        pageNum++;
      }
    }
    
    // Sauvegarder le PDF
    pdf.save(`${filename}.pdf`);
    
    Logger.log('PDF sauvegardé avec succès', { 
      filename: `${filename}.pdf`,
      totalPages: pdf.getNumberOfPages()
    });
  }

  private addTitlePage(pdf: jsPDF, options: {
    title?: string;
    entityName?: string;
    subtitle?: string;
  }, margin: number, pageWidth: number, pageHeight: number): void {
    const centerX = pageWidth / 2;
    let currentY = pageHeight / 4; // Commencer un peu plus haut
    
    // Titre principal
    if (options.title) {
      pdf.setFontSize(26);
      pdf.setTextColor(0, 0, 0);
      pdf.text(options.title, centerX, currentY, { align: 'center' });
      currentY += 20; // Plus d'espace après le titre
    }
    
    // Nom de l'entité
    if (options.entityName) {
      pdf.setFontSize(16);
      pdf.setTextColor(70, 70, 70);
      pdf.text(options.entityName, centerX, currentY, { align: 'center' });
      currentY += 15; // Plus d'espace après l'entité
    }
    
    // Sous-titre
    if (options.subtitle) {
      pdf.setFontSize(12);
      pdf.setTextColor(120, 120, 120);
      pdf.text(options.subtitle, centerX, currentY, { align: 'center' });
      currentY += 15; // Plus d'espace après le sous-titre
    }
    
    // Date de génération (plus espacée)
    const dateStr = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    pdf.setFontSize(10);
    pdf.setTextColor(140, 140, 140);
    pdf.text(dateStr, centerX, currentY + 30, { align: 'center' });
    
    // Ligne de séparation plus élégante
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.8);
    pdf.line(margin + 30, currentY + 50, pageWidth - margin - 30, currentY + 50);
    
    // Ajouter une note en bas de page
    pdf.setFontSize(8);
    pdf.setTextColor(160, 160, 160);
    pdf.text('Document confidentiel - Usage interne uniquement', centerX, pageHeight - 20, { align: 'center' });
  }
}

// Fonction utilitaire pour formater les données pour l'export
export function formatDataForExport(data: any[], columns: string[]): ExportData {
  return {
    sheets: [{
      name: 'Données',
      data: data.map(item => {
        const row: any = {};
        columns.forEach(column => {
          row[column] = item[column] || '';
        });
        return row;
      }),
      columns: columns.map(column => ({
        header: column,
        key: column,
        width: 15
      }))
    }],
    filename: 'export-patrimoine',
    title: 'Export Patrimoine',
    description: 'Données exportées depuis le gestionnaire de patrimoine'
  };
}

// Instances exportées
export const secureExcelExport = new SecureExcelExport();
export const securePDFExport = new SecurePDFExport();
export { Logger }; 