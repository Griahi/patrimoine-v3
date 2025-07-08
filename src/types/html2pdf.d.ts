declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: { type: string; quality: number }
    html2canvas?: { 
      scale: number
      useCORS: boolean
      allowTaint: boolean
      backgroundColor: string
      width?: number
      height?: number
      scrollX?: number
      scrollY?: number
    }
    jsPDF?: { 
      unit: string
      format: string
      orientation: string
      compress?: boolean
    }
    pagebreak?: { mode: string[] }
  }
  
  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance
    from(element: HTMLElement): Html2PdfInstance
    save(): Promise<void> | void
    outputPdf(type: string): Promise<Blob>
  }
  
  function html2pdf(): Html2PdfInstance
  export = html2pdf
}

// Type pour html2pdf global
declare const html2pdf: any 