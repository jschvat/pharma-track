const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFReportService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate PDF from HTML content
   * @param {string} htmlContent - HTML content to convert
   * @param {Object} options - PDF generation options
   * @returns {Buffer} PDF buffer
   */
  async generatePDF(htmlContent, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set content
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate PDF with options
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; margin: 0 auto; color: #666;">
            <span class="title"></span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; margin: 0 auto; color: #666; width: 100%; text-align: center;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString()}</span>
          </div>
        `,
        ...options
      };

      const pdf = await page.pdf(pdfOptions);
      return pdf;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate Inventory Report PDF
   * @param {Object} data - Inventory data
   * @param {Object} storeInfo - Store information
   * @returns {Buffer} PDF buffer
   */
  async generateInventoryReport(data, storeInfo) {
    const htmlContent = this.generateInventoryHTML(data, storeInfo);
    return await this.generatePDF(htmlContent, {
      headerTemplate: `
        <div style="font-size: 12px; margin: 0 auto; color: #333; font-weight: bold;">
          Inventory Report - ${storeInfo.name}
        </div>
      `
    });
  }

  /**
   * Generate Audit Report PDF
   * @param {Object} auditData - Audit trail data
   * @param {Object} storeInfo - Store information
   * @returns {Buffer} PDF buffer
   */
  async generateAuditReport(auditData, storeInfo) {
    const htmlContent = this.generateAuditHTML(auditData, storeInfo);
    return await this.generatePDF(htmlContent, {
      headerTemplate: `
        <div style="font-size: 12px; margin: 0 auto; color: #333; font-weight: bold;">
          Audit Report - ${storeInfo.name}
        </div>
      `
    });
  }

  /**
   * Generate NDC Audit Report PDF
   * @param {Object} ndcAuditData - NDC audit data
   * @param {Object} storeInfo - Store information
   * @returns {Buffer} PDF buffer
   */
  async generateNDCAuditReport(ndcAuditData, storeInfo) {
    const htmlContent = this.generateNDCAuditHTML(ndcAuditData, storeInfo);
    return await this.generatePDF(htmlContent, {
      headerTemplate: `
        <div style="font-size: 12px; margin: 0 auto; color: #333; font-weight: bold;">
          NDC Audit Report - ${ndcAuditData.drug_info.ndc}
        </div>
      `
    });
  }

  /**
   * Generate HTML for Inventory Report
   */
  generateInventoryHTML(data, storeInfo) {
    const { inventory, stats } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Inventory Report - ${storeInfo.name}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.4; 
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #2c3e50; 
          padding-bottom: 15px; 
          margin-bottom: 20px;
        }
        .header h1 { 
          color: #2c3e50; 
          margin: 0 0 10px 0; 
          font-size: 24px;
        }
        .store-info { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          margin-bottom: 20px;
        }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 15px; 
          margin-bottom: 20px;
        }
        .stat-card { 
          background: #e3f2fd; 
          padding: 15px; 
          border-radius: 5px; 
          text-align: center;
        }
        .stat-value { 
          font-size: 18px; 
          font-weight: bold; 
          color: #1976d2;
        }
        .stat-label { 
          font-size: 11px; 
          color: #666; 
          margin-top: 5px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          font-size: 10px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background: #2c3e50; 
          color: white; 
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background: #f9f9f9;
        }
        .low-stock { 
          background: #fff3cd !important; 
          color: #856404;
        }
        .expired { 
          background: #f8d7da !important; 
          color: #721c24;
        }
        .page-break { 
          page-break-before: always;
        }
        .currency { 
          text-align: right;
        }
        .center { 
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Inventory Report</h1>
        <h2>${storeInfo.name}</h2>
        <p>${storeInfo.address}</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <div class="store-info">
        <h3>Store Information</h3>
        <p><strong>DEA Registration:</strong> ${storeInfo.dea_registration_number || 'N/A'}</p>
        <p><strong>NPI:</strong> ${storeInfo.npi || 'N/A'}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total_items || 0}</div>
          <div class="stat-label">Total Items</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.low_stock_items || 0}</div>
          <div class="stat-label">Low Stock Items</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${Number(stats.total_inventory_value || 0).toLocaleString()}</div>
          <div class="stat-label">Total Value</div>
        </div>
      </div>

      <h3>📦 Inventory Details</h3>
      <table>
        <thead>
          <tr>
            <th>NDC</th>
            <th>Drug Name</th>
            <th>Manufacturer</th>
            <th>Qty on Hand</th>
            <th>Reorder Level</th>
            <th>Unit Cost</th>
            <th>Selling Price</th>
            <th>Lot Number</th>
            <th>Expiration</th>
          </tr>
        </thead>
        <tbody>
          ${inventory.map(item => `
            <tr class="${item.quantity_on_hand <= item.reorder_level ? 'low-stock' : ''}">
              <td class="center">${item.ndc}</td>
              <td>${item.generic_name}${item.brand_name ? ` (${item.brand_name})` : ''}</td>
              <td>${item.manufacturer_name || ''}</td>
              <td class="center">${item.quantity_on_hand}</td>
              <td class="center">${item.reorder_level}</td>
              <td class="currency">$${Number(item.unit_cost || 0).toFixed(2)}</td>
              <td class="currency">$${Number(item.selling_price || 0).toFixed(2)}</td>
              <td class="center">${item.lot_number || 'N/A'}</td>
              <td class="center">${item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 30px; font-size: 10px; color: #666;">
        <p><strong>Legend:</strong></p>
        <p>🟡 Low Stock Items (quantity ≤ reorder level)</p>
        <p>This report contains ${inventory.length} inventory items for ${storeInfo.name}</p>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate HTML for Audit Report
   */
  generateAuditHTML(auditData, storeInfo) {
    const { audit_entries, summary } = auditData;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Audit Report - ${storeInfo.name}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.4; 
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #2c3e50; 
          padding-bottom: 15px; 
          margin-bottom: 20px;
        }
        .header h1 { 
          color: #2c3e50; 
          margin: 0 0 10px 0; 
          font-size: 24px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          font-size: 10px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 6px; 
          text-align: left;
        }
        th { 
          background: #2c3e50; 
          color: white; 
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background: #f9f9f9;
        }
        .transaction-type { 
          padding: 2px 6px; 
          border-radius: 3px; 
          font-weight: bold; 
          font-size: 9px;
        }
        .type-fill { background: #ffebee; color: #c62828; }
        .type-return { background: #e8f5e8; color: #2e7d32; }
        .type-audit { background: #fff3e0; color: #ef6c00; }
        .type-expire { background: #fce4ec; color: #ad1457; }
        .type-adjustment { background: #e3f2fd; color: #1976d2; }
        .center { text-align: center; }
        .number { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Audit Trail Report</h1>
        <h2>${storeInfo.name}</h2>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <h3>📈 Transaction Summary</h3>
      <table style="width: 60%; margin-bottom: 20px;">
        <tr><td><strong>Total Transactions:</strong></td><td class="number">${summary?.total_transactions || 0}</td></tr>
        <tr><td><strong>Prescription Fills:</strong></td><td class="number">${summary?.prescription_fills || 0}</td></tr>
        <tr><td><strong>Returns to Stock:</strong></td><td class="number">${summary?.returns || 0}</td></tr>
        <tr><td><strong>Expired Items:</strong></td><td class="number">${summary?.expirations || 0}</td></tr>
        <tr><td><strong>Audit Adjustments:</strong></td><td class="number">${summary?.audits || 0}</td></tr>
      </table>

      <h3>📋 Transaction Details</h3>
      <table>
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Drug</th>
            <th>NDC</th>
            <th>Transaction Type</th>
            <th>Qty Change</th>
            <th>Qty Before</th>
            <th>Qty After</th>
            <th>Performed By</th>
            <th>Reason</th>
            <th>Reference #</th>
          </tr>
        </thead>
        <tbody>
          ${audit_entries?.map(entry => `
            <tr>
              <td class="center">${new Date(entry.transaction_date).toLocaleString()}</td>
              <td>${entry.generic_name}${entry.brand_name ? ` (${entry.brand_name})` : ''}</td>
              <td class="center">${entry.ndc}</td>
              <td class="center">
                <span class="transaction-type type-${entry.transaction_type.replace('_', '-')}">
                  ${entry.transaction_type.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td class="number">${entry.quantity_change > 0 ? '+' : ''}${entry.quantity_change}</td>
              <td class="number">${entry.quantity_before}</td>
              <td class="number">${entry.quantity_after}</td>
              <td>${entry.performed_by_name}</td>
              <td>${entry.reason || 'N/A'}</td>
              <td class="center">${entry.reference_number || 'N/A'}</td>
            </tr>
          `).join('') || '<tr><td colspan="10" class="center">No audit entries found</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
    `;
  }

  /**
   * Generate HTML for NDC Audit Report
   */
  generateNDCAuditHTML(ndcAuditData, storeInfo) {
    const { drug_info, audit_entries, audit_summary, current_inventory } = ndcAuditData;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NDC Audit Report - ${drug_info.ndc}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.4; 
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #2c3e50; 
          padding-bottom: 15px; 
          margin-bottom: 20px;
        }
        .header h1 { 
          color: #2c3e50; 
          margin: 0 0 10px 0; 
          font-size: 24px;
        }
        .drug-info { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 5px; 
          margin-bottom: 20px;
        }
        .summary-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 15px; 
          margin-bottom: 20px;
        }
        .summary-card { 
          background: #e3f2fd; 
          padding: 15px; 
          border-radius: 5px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          font-size: 10px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 6px; 
          text-align: left;
        }
        th { 
          background: #2c3e50; 
          color: white; 
          font-weight: bold;
        }
        tr:nth-child(even) { 
          background: #f9f9f9;
        }
        .center { text-align: center; }
        .number { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔍 NDC Audit Report</h1>
        <h2>NDC: ${drug_info.ndc}</h2>
        <h3>${drug_info.generic_name}${drug_info.brand_name ? ` (${drug_info.brand_name})` : ''}</h3>
        <p>${storeInfo.name}</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>

      <div class="drug-info">
        <h3>Drug Information</h3>
        <p><strong>NDC:</strong> ${drug_info.ndc}</p>
        <p><strong>Generic Name:</strong> ${drug_info.generic_name}</p>
        <p><strong>Brand Name:</strong> ${drug_info.brand_name || 'N/A'}</p>
        <p><strong>Manufacturer:</strong> ${drug_info.manufacturer_name || 'N/A'}</p>
        <p><strong>Dosage Form:</strong> ${drug_info.dosage_form || 'N/A'}</p>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h4>Transaction Summary</h4>
          <p><strong>Total Transactions:</strong> ${audit_summary.total_transactions}</p>
          <p><strong>Final Running Total:</strong> ${audit_summary.final_running_total}</p>
        </div>
        <div class="summary-card">
          <h4>Current Inventory</h4>
          ${current_inventory?.map(inv => `
            <p><strong>Quantity on Hand:</strong> ${inv.quantity_on_hand}</p>
            <p><strong>Lot Number:</strong> ${inv.lot_number || 'N/A'}</p>
            <p><strong>Expiration:</strong> ${inv.expiration_date ? new Date(inv.expiration_date).toLocaleDateString() : 'N/A'}</p>
          `).join('') || '<p>No current inventory</p>'}
        </div>
      </div>

      <h3>📋 Transaction History with Running Totals</h3>
      <table>
        <thead>
          <tr>
            <th>Date/Time</th>
            <th>Transaction Type</th>
            <th>Qty Change</th>
            <th>Qty Before</th>
            <th>Qty After</th>
            <th>Running Total</th>
            <th>Performed By</th>
            <th>Reason</th>
            <th>Reference #</th>
          </tr>
        </thead>
        <tbody>
          ${audit_entries?.map(entry => `
            <tr>
              <td class="center">${new Date(entry.transaction_date).toLocaleString()}</td>
              <td class="center">${entry.transaction_type.replace('_', ' ').toUpperCase()}</td>
              <td class="number">${entry.quantity_change > 0 ? '+' : ''}${entry.quantity_change}</td>
              <td class="number">${entry.quantity_before}</td>
              <td class="number">${entry.quantity_after}</td>
              <td class="number"><strong>${entry.running_total}</strong></td>
              <td>${entry.performed_by_name}</td>
              <td>${entry.reason || 'N/A'}</td>
              <td class="center">${entry.reference_number || 'N/A'}</td>
            </tr>
          `).join('') || '<tr><td colspan="9" class="center">No audit entries found</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 30px; font-size: 10px; color: #666;">
        <p><strong>Report Details:</strong></p>
        <p>This report shows the complete audit trail for NDC ${drug_info.ndc} at ${storeInfo.name}</p>
        <p>Running totals show cumulative quantity changes over time</p>
      </div>
    </body>
    </html>
    `;
  }
}

module.exports = new PDFReportService();