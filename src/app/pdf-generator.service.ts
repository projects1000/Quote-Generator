import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
  generateQuotationPDF(data: {
    companyName: string;
    companyAddress: string;
    companyMobile: string;
    clientPrefix: string;
    clientName: string;
    clientEmail: string;
    clientContact: string;
    clientLocation: string;
    logoUrl?: string;
    sections: Array<{ heading: string; items: string[] }>;
    totalCost?: number;
    // Optional rendering controls (all off by default)
    options?: {
      // Start a new page before any section whose heading contains the word "Floor" (e.g., Ground/First/Second Floor)
      newPageBeforeFloorSections?: boolean;
      // Start a new page before these specific headings (case-insensitive match)
      newPageBeforeHeadings?: string[];
    };
  }) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    let renderedTotalSummary = false;
    const today = new Date();
    const dateStr = today.toLocaleDateString();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(60, 60, 60);
    doc.text('Date: ' + dateStr, pageWidth - 20, y, { align: 'right' });
    y += 2;
    if (data.logoUrl) {
      const logoSize = 25.4;
      doc.addImage(data.logoUrl, 'PNG', pageWidth/2 - logoSize/2, y + 5, logoSize, logoSize);
      y += logoSize + 7;
    } else {
      y += 10;
    }
    doc.setFontSize(20);
    doc.setTextColor(25, 118, 210);
    doc.text((data.companyName ? data.companyName + ' Quotation' : 'Quotation'), pageWidth/2, y, { align: 'center' });
    doc.setTextColor(60, 60, 60);
    y += 14;
    doc.setLineWidth(0.3);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;
    doc.setFontSize(15);
    doc.setTextColor(25, 118, 210);
    doc.text('Company Info', 20, y);
    doc.setTextColor(60, 60, 60);
    y += 8;
    doc.setFontSize(12);
    doc.text('Name: ' + (data.companyName || ''), 22, y);
    y += 7;
    doc.text('Address: ' + (data.companyAddress || ''), 22, y);
    y += 7;
    doc.text('Mobile: ' + (data.companyMobile || ''), 22, y);
    y += 10;
    doc.setFontSize(15);
    doc.setTextColor(25, 118, 210);
    doc.text('Client Info', 20, y);
    doc.setTextColor(60, 60, 60);
    y += 8;
    doc.setFontSize(12);
    doc.text('Name: ' + (data.clientPrefix || '') + ' ' + (data.clientName || ''), 22, y);
    y += 7;
    doc.text('Email: ' + (data.clientEmail || ''), 22, y);
    y += 7;
    doc.text('Contact: ' + (data.clientContact || ''), 22, y);
    y += 7;
    doc.text('Location: ' + (data.clientLocation || ''), 22, y);
    y += 10;

    // helpers
    const pageHeight = doc.internal.pageSize.getHeight();
    const ensurePage = (height: number) => {
      if (y + height > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    };

  // Render all sections in tabular format
    for (const section of data.sections) {
      const headingLower = section.heading.toLowerCase();
      // Optional: force a page break before certain sections for better visual grouping
      if (data.options?.newPageBeforeFloorSections && headingLower.includes('floor')) {
        doc.addPage();
        y = 20;
      } else if (data.options?.newPageBeforeHeadings && data.options.newPageBeforeHeadings.length) {
        const shouldBreak = data.options.newPageBeforeHeadings.some(h => headingLower === h.toLowerCase());
        if (shouldBreak) {
          doc.addPage();
          y = 20;
        }
      }
      // Ensure there's room for the section heading; if not, start a new page
      ensurePage(18);
      doc.setFontSize(15);
      doc.setTextColor(25, 118, 210);
      doc.text(section.heading, 20, y);
      doc.setTextColor(60, 60, 60);
      y += 8;
      doc.setFontSize(12);
      const heading = headingLower;

      // Special case: For 'Super Structure' we only want a group heading.
      // The actual details should appear under per-floor sections (Ground/1st/2nd...).
      // So skip rendering a table for 'Super Structure' itself to avoid duplication.
      if (heading.includes('super structure')) {
        y += 4; // small spacer before the first floor subsection
        continue;
      }
      // Special rendering for Pilling Quotation: two-column key/value table with borders
      if (heading.includes('pilling')) {
        const tableX = 20;
        const tableWidth = pageWidth - 40;
        const col1Width = Math.floor(tableWidth * 0.45);
        const col2Width = tableWidth - col1Width;
        const rowHeight = 10;

        // Header row
        doc.setFillColor(230, 240, 255);
        ensurePage(rowHeight);
        doc.rect(tableX, y, tableWidth, rowHeight, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('Details', tableX + 2, y + 7);
        doc.text('Value', tableX + col1Width + 2, y + 7);
        y += rowHeight;

        // Render each field as its own row; wrap as needed
        const rows = section.items.map((s) => {
          const idx = s.indexOf(':');
          if (idx > -1) {
            return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
          }
          return [s, ''];
        });

        for (const [key, value] of rows) {
          const keyLines = doc.splitTextToSize(key, col1Width - 4);
          const valueLines = doc.splitTextToSize(value, col2Width - 4);
          const neededRows = Math.max(keyLines.length, valueLines.length);
          const cellHeight = neededRows * 8 + 2;

          // Page break if needed
          ensurePage(cellHeight);

          // Draw row borders
          doc.rect(tableX, y, col1Width, cellHeight);
          doc.rect(tableX + col1Width, y, col2Width, cellHeight);

          // Write text with wrapping
          for (let i = 0; i < neededRows; i++) {
            const ky = y + 7 + i * 8;
            if (keyLines[i]) doc.text(keyLines[i], tableX + 2, ky);
            if (valueLines[i]) doc.text(valueLines[i], tableX + col1Width + 2, ky);
          }
          y += cellHeight;
        }
        y += 6;
        continue; // skip generic renderer for this section
      }

      // Plinth/Foundation, Super Structure, Cost Breakdown, and per-floor sections: key/value table
      if (heading.includes('plinth') || heading.includes('foundation') || heading.includes('cost breakdown') || heading.includes('floor')) {
        const tableX = 20;
        const tableWidth = pageWidth - 40;
        const col1Width = Math.floor(tableWidth * 0.45);
        const col2Width = tableWidth - col1Width;
        const rowHeaderH = 10;
        doc.setFillColor(230, 240, 255);
        ensurePage(rowHeaderH);
        doc.rect(tableX, y, tableWidth, rowHeaderH, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('Details', tableX + 2, y + 7);
        doc.text('Value', tableX + col1Width + 2, y + 7);
        y += rowHeaderH;

        const rows = section.items.map((s) => {
          const idx = s.indexOf(':');
          if (idx > -1) return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
          return [s, ''];
        });

        for (const [key, value] of rows) {
          const keyLines = doc.splitTextToSize(key, col1Width - 4);
          const valueLines = doc.splitTextToSize(value, col2Width - 4);
          const neededRows = Math.max(keyLines.length, valueLines.length);
          const cellHeight = neededRows * 8 + 2;
          ensurePage(cellHeight);
          doc.rect(tableX, y, col1Width, cellHeight);
          doc.rect(tableX + col1Width, y, col2Width, cellHeight);
          for (let i = 0; i < neededRows; i++) {
            const ky = y + 7 + i * 8;
            if (keyLines[i]) doc.text(keyLines[i], tableX + 2, ky);
            if (valueLines[i]) doc.text(valueLines[i], tableX + col1Width + 2, ky);
          }
          y += cellHeight;
        }
        y += 6;

        // If this is the Cost Breakdown section, place the Total Project Cost summary right below it
        if (heading.includes('cost breakdown') && data.totalCost !== undefined) {
          // Ensure there's enough space for title + row (~26px)
          ensurePage(26);
          doc.setFontSize(15);
          doc.setTextColor(25, 118, 210);
          doc.text('Total Project Cost', 20, y);
          y += 8;
          doc.setFontSize(13);
          doc.setFillColor(230, 240, 255);
          doc.rect(20, y, pageWidth - 40, 10, 'F');
          doc.setTextColor(0, 0, 0);
          doc.text('Grand Total', 22, y + 7);
          doc.text('Rs. ' + data.totalCost.toLocaleString(), pageWidth - 60, y + 7);
          y += 16;
          renderedTotalSummary = true;
        }
        continue;
      }

      // Payment Structure: two columns Stage / %
      if (heading.includes('payment')) {
        const tableX = 20;
        const tableWidth = pageWidth - 40;
        const col1Width = Math.floor(tableWidth * 0.75);
        const col2Width = tableWidth - col1Width;
        const rowHeaderH = 10;
        doc.setFillColor(230, 240, 255);
        ensurePage(rowHeaderH);
        doc.rect(tableX, y, tableWidth, rowHeaderH, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('Stage', tableX + 2, y + 7);
        doc.text('%', tableX + col1Width + 2, y + 7);
        y += rowHeaderH;

        for (const it of section.items) {
          const m = it.match(/^(.*?):\s*(\d+(?:\.\d+)?)%/);
          const stage = m ? m[1].trim() : it;
          const perc = m ? m[2] : '';
          const stageLines = doc.splitTextToSize(stage, col1Width - 4);
          const cellHeight = stageLines.length * 8 + 2;
          ensurePage(cellHeight);
          doc.rect(tableX, y, col1Width, cellHeight);
          doc.rect(tableX + col1Width, y, col2Width, cellHeight);
          for (let i = 0; i < stageLines.length; i++) {
            const ky = y + 7 + i * 8;
            doc.text(stageLines[i], tableX + 2, ky);
            if (i === 0 && perc) doc.text(perc, tableX + col1Width + 2, ky);
          }
          y += cellHeight;
        }
        y += 6;
        continue;
      }

      // Extra Work: Description / Amount / Remarks
      if (heading.includes('extra work')) {
        const tableX = 20;
        const tableWidth = pageWidth - 40;
        const colDesc = Math.floor(tableWidth * 0.55);
        const colAmt = Math.floor(tableWidth * 0.2);
        const colRem = tableWidth - colDesc - colAmt;
        const rowHeaderH = 10;
        doc.setFillColor(230, 240, 255);
        ensurePage(rowHeaderH);
        doc.rect(tableX, y, tableWidth, rowHeaderH, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('Description', tableX + 2, y + 7);
        doc.text('Amount', tableX + colDesc + 2, y + 7);
        doc.text('Remarks', tableX + colDesc + colAmt + 2, y + 7);
        y += rowHeaderH;

        for (const it of section.items) {
          const m = it.match(/^(.+?)(?:\s*-\s*Rs\.\s*([\d,]+(?:\.\d+)?))?(?:\s*\((.*?)\))?$/);
          const desc = m ? m[1].trim() : it;
          const amt = m && m[2] ? `Rs. ${m[2]}` : '';
          const rem = m && m[3] ? m[3] : '';
          const descLines = doc.splitTextToSize(desc, colDesc - 4);
          const remLines = doc.splitTextToSize(rem, colRem - 4);
          const neededRows = Math.max(descLines.length, Math.max(1, remLines.length));
          const cellHeight = neededRows * 8 + 2;
          ensurePage(cellHeight);
          doc.rect(tableX, y, colDesc, cellHeight);
          doc.rect(tableX + colDesc, y, colAmt, cellHeight);
          doc.rect(tableX + colDesc + colAmt, y, colRem, cellHeight);
          for (let i = 0; i < neededRows; i++) {
            const ky = y + 7 + i * 8;
            if (descLines[i]) doc.text(descLines[i], tableX + 2, ky);
            if (i === 0 && amt) doc.text(amt, tableX + colDesc + 2, ky);
            if (remLines[i]) doc.text(remLines[i], tableX + colDesc + colAmt + 2, ky);
          }
          y += cellHeight;
        }
        y += 6;
        continue;
      }

      // Bore Well Costing: Item / Qty / Rate / Amount
      if (heading.includes('bore well')) {
        const tableX = 20;
        const tableWidth = pageWidth - 40;
        const colItem = Math.floor(tableWidth * 0.5);
        const colQty = Math.floor(tableWidth * 0.12);
        const colRate = Math.floor(tableWidth * 0.18);
        const colAmt = tableWidth - colItem - colQty - colRate;
        const rowHeaderH = 10;
        doc.setFillColor(230, 240, 255);
        ensurePage(rowHeaderH);
        doc.rect(tableX, y, tableWidth, rowHeaderH, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('Item', tableX + 2, y + 7);
        doc.text('Qty', tableX + colItem + 2, y + 7);
        doc.text('Rate', tableX + colItem + colQty + 2, y + 7);
        doc.text('Amount', tableX + colItem + colQty + colRate + 2, y + 7);
        y += rowHeaderH;

        for (const it of section.items) {
          const m = it.match(/^(.+?):\s*Qty\s*([\d.]+)\s*,\s*Rate\s*Rs\.?\s*([\d.]+)/i);
          const item = m ? m[1].trim() : it;
          const qty = m ? m[2] : '';
          const rate = m ? `Rs. ${m[3]}` : '';
          const amount = m ? `Rs. ${(Number(m[2]) * Number(m[3]) || 0).toLocaleString()}` : '';
          const itemLines = doc.splitTextToSize(item, colItem - 4);
          const neededRows = Math.max(1, itemLines.length);
          const cellHeight = neededRows * 8 + 2;
          ensurePage(cellHeight);
          doc.rect(tableX, y, colItem, cellHeight);
          doc.rect(tableX + colItem, y, colQty, cellHeight);
          doc.rect(tableX + colItem + colQty, y, colRate, cellHeight);
          doc.rect(tableX + colItem + colQty + colRate, y, colAmt, cellHeight);
          for (let i = 0; i < neededRows; i++) {
            const ky = y + 7 + i * 8;
            if (itemLines[i]) doc.text(itemLines[i], tableX + 2, ky);
            if (i === 0 && qty) doc.text(qty, tableX + colItem + 2, ky);
            if (i === 0 && rate) doc.text(rate, tableX + colItem + colQty + 2, ky);
            if (i === 0 && amount) doc.text(amount, tableX + colItem + colQty + colRate + 2, ky);
          }
          y += cellHeight;
        }
        y += 6;
        continue;
      }

      // Fallback: Generic table with Details/Amount columns (borderless)
      doc.setFillColor(230, 240, 255);
      const detailsColX = 22;
      const detailsColWidth = Math.floor((pageWidth - 40) * 0.65);
      const amountColX = detailsColX + detailsColWidth + 4;
      ensurePage(8);
      doc.rect(20, y, pageWidth - 40, 8, 'F');
      doc.text('Details', detailsColX, y + 6);
      doc.text('Amount', amountColX, y + 6);
      y += 10;
      for (const item of section.items) {
        let detail = item;
        let amount = '';
        const match = item.match(/^(.*?)(?:\s*[:\-]?\s*)(₹|Rs\.?|INR)?\s*([\d,]+(\.\d+)?)(\s*)?$/);
        if (match && match[2]) {
          detail = match[1].trim();
          amount = match[3] ? `Rs. ${match[3]}` : '';
        }
        const detailLines = doc.splitTextToSize(detail, detailsColWidth);
        for (let i = 0; i < detailLines.length; i++) {
          ensurePage(8);
          doc.text(detailLines[i], detailsColX, y);
          if (i === 0 && amount) {
            doc.text(amount, amountColX, y);
          }
          y += 8;
        }
      }
      y += 6;
    }
    // Fallback: if Total wasn't rendered (e.g., Cost Breakdown missing), render at the end
    if (!renderedTotalSummary && data.totalCost !== undefined) {
      doc.setFontSize(15);
      doc.setTextColor(25, 118, 210);
      doc.text('Total Project Cost', 20, y);
      y += 8;
      doc.setFontSize(13);
      doc.setFillColor(230, 240, 255);
      doc.rect(20, y, pageWidth - 40, 10, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text('Grand Total', 22, y + 7);
      doc.text('Rs. ' + data.totalCost.toLocaleString(), pageWidth - 60, y + 7);
      y += 16;
    }

  // Always render Note* block near the bottom of the final page
  // Content requested by user, in brown color
    const noteHeading = 'Note*';
    const noteLinesRaw = [
      'For non-branded items or accessories, prices may change and will be discussed with the customer.',
      'The final payment structure will be based on client change requirements.'
    ];
    // Compute required height
    doc.setFontSize(12);
    const noteTextWidth = pageWidth - 40; // within margins
    const wrappedLines: string[] = [];
    for (const l of noteLinesRaw) {
      const lines = doc.splitTextToSize('• ' + l, noteTextWidth);
      wrappedLines.push(...lines);
    }
    const headingH = 8;
    const lineH = 7;
    const blockHeight = headingH + 4 + wrappedLines.length * lineH; // heading + spacing + lines
    const targetY = pageHeight - 20 - blockHeight; // 20 margin
    if (y <= targetY - 6) {
      // Enough room to pin at bottom of this page
      let yNote = pageHeight - 20 - blockHeight;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(165, 42, 42); // brown
      doc.text(noteHeading, 20, yNote + headingH);
      yNote += headingH + 4;
      doc.setFont('helvetica', 'normal');
      for (const ln of wrappedLines) {
        doc.text(ln, 20, yNote);
        yNote += lineH;
      }
    } else {
      // Not enough space to pin; render inline at current cursor without forcing a new page
      // so we don't create an unnecessary trailing page.
      const ensurePageInline = (h: number) => {
        if (y + h > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
      };
      // Heading
      ensurePageInline(headingH + 2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(165, 42, 42);
      doc.text(noteHeading, 20, y + headingH);
      y += headingH + 4;
      // Body
      doc.setFont('helvetica', 'normal');
      for (const ln of wrappedLines) {
        ensurePageInline(lineH);
        doc.text(ln, 20, y);
        y += lineH;
      }
    }
    // Build filename: CompanyName_ClientName_Quotation_<date>.pdf
    const sanitize = (s: string) => (s || '')
      .toString()
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-') // illegal filename chars
      .replace(/\s+/g, '_'); // spaces to underscores
    const companyPart = sanitize(data.companyName || 'Company');
    const clientPart = sanitize(data.clientName || 'Client');
    const datePart = sanitize(dateStr);
    const fileName = `${companyPart}_${clientPart}_Quotation_${datePart}.pdf`;
    doc.save(fileName);
  }
}
