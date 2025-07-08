import { NextResponse } from 'next/server'
import { generateExcelTemplate } from '@/services/excel-parser'
import * as XLSX from 'xlsx'

export async function GET() {
  try {
    console.log('Generating Excel template via API...')
    
    // Generate the workbook
    const workbook = generateExcelTemplate()
    
    // Convert to buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true,
    })
    
    console.log('Template generated successfully, size:', buffer.length, 'bytes')
    
    // Return the file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-patrimoine.xlsx"',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du template' },
      { status: 500 }
    )
  }
} 