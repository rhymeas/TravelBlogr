/**
 * API Route: Export Itinerary as PDF
 * Generates a beautiful PDF document of the travel plan
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan } = body

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan data is required' },
        { status: 400 }
      )
    }

    console.log(`📄 Generating PDF for: ${plan.title}`)

    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML(plan)

    // For now, return HTML that can be printed as PDF
    // In production, you'd use a library like puppeteer or jsPDF
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${sanitizeFilename(plan.title)}.html"`
      }
    })

  } catch (error: any) {
    console.error('❌ Error generating PDF:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate PDF' 
      },
      { status: 500 }
    )
  }
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generatePDFHTML(plan: any): string {
  const totalCost = plan.days.reduce((total: number, day: any) => {
    return total + day.items.reduce((dayTotal: number, item: any) => {
      return dayTotal + (item.costEstimate || 0)
    }, 0)
  }, 0)

  const totalActivities = plan.days.reduce((total: number, day: any) =>
    total + day.items.filter((item: any) => item.type === 'activity').length, 0)

  const totalMeals = plan.days.reduce((total: number, day: any) =>
    total + day.items.filter((item: any) => item.type === 'meal').length, 0)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${plan.title}</title>
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #14b8a6;
    }
    
    h1 {
      color: #14b8a6;
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .summary {
      color: #6b7280;
      font-size: 16px;
      margin-bottom: 20px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #14b8a6;
    }
    
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }
    
    .day {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .day-header {
      background: #14b8a6;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .day-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .day-date {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .item {
      background: #f9fafb;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 3px solid #14b8a6;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 8px;
    }
    
    .item-title {
      font-weight: 600;
      font-size: 16px;
      color: #111827;
    }
    
    .item-time {
      color: #6b7280;
      font-size: 14px;
    }
    
    .item-description {
      color: #4b5563;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .item-meta {
      display: flex;
      gap: 15px;
      font-size: 13px;
      color: #6b7280;
    }
    
    .tips {
      background: #fef3c7;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    
    .tips h3 {
      color: #92400e;
      margin-top: 0;
    }
    
    .tips ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .tips li {
      color: #78350f;
      margin-bottom: 8px;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #14b8a6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .print-button:hover {
      background: #0d9488;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  
  <div class="header">
    <h1>${plan.title}</h1>
    <p class="summary">${plan.summary}</p>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${plan.days.length}</div>
      <div class="stat-label">Days</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalActivities}</div>
      <div class="stat-label">Activities</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalMeals}</div>
      <div class="stat-label">Meals</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">$${totalCost}</div>
      <div class="stat-label">Est. Cost</div>
    </div>
  </div>
  
  ${plan.days.map((day: any, index: number) => `
    <div class="day ${index > 0 && index % 2 === 0 ? 'page-break' : ''}">
      <div class="day-header">
        <div class="day-title">Day ${day.day}: ${day.location}</div>
        <div class="day-date">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      ${day.items.map((item: any) => `
        <div class="item">
          <div class="item-header">
            <div class="item-title">${item.title}</div>
            <div class="item-time">${item.time}</div>
          </div>
          <div class="item-description">${item.description}</div>
          <div class="item-meta">
            <span>⏱️ ${item.duration}h</span>
            <span>💰 $${item.costEstimate || 0}</span>
            <span>📍 ${item.type}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')}
  
  ${plan.tips && plan.tips.length > 0 ? `
    <div class="tips">
      <h3>💡 Travel Tips</h3>
      <ul>
        ${plan.tips.map((tip: string) => `<li>${tip}</li>`).join('')}
      </ul>
    </div>
  ` : ''}
  
  <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px;">
    Generated by TravelBlogr • ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`
}

