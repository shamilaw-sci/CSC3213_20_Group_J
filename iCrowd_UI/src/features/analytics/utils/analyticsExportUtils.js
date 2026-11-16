/**
 * Helper to download CSV string as a file in browser
 */
function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function sanitizeCSV(val) {
  if (val === null || val === undefined) return '""';
  const first = typeof val === 'string' ? [...val].find(ch => ch.charCodeAt(0) > 32 && ch.trim()) : undefined;
  const safe = first && '=+@-'.includes(first) ? `'${val}` : val;
  const stringVal = String(safe).replace(/"/g, '""');
  return `"${stringVal}"`;
}

export function sanitizeExcelText(value) {
  const text = String(value ?? '');
  const first = [...text].find(character => character.charCodeAt(0) > 32 && character.trim());
  const safe = first && '=+@-'.includes(first) ? `'${text}` : text;
  return safe.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

/**
 * 1. Export Full Executive Analytics CSV Report with Customer BI, Category Performance & Dead Stock
 */
export function exportFullAnalyticsCSV(data) {
  if (!data) return;

  const dateStr = new Date().toISOString().slice(0, 10);
  const rangeLabel = data.overview?.dateRangeLabel || 'All Time';
  const filename = `iCrowd_Advanced_BI_Report_${rangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`;

  const rows = [];

  // Header Banner
  rows.push(['iCrowd Advanced Sales Analytics & Business Intelligence Report']);
  rows.push(['Generated Date', new Date().toLocaleString()]);
  rows.push(['Active Filter Period', rangeLabel]);
  rows.push(['Data Source', data.dataSource || 'Live Production Database']);
  rows.push([]);

  // Section 1: Executive KPI Overview
  rows.push(['=== 1. EXECUTIVE KPI OVERVIEW ===']);
  rows.push(['Metric', 'Value', 'Notes']);
  rows.push(['Total Revenue', `Rs. ${Number(data.overview?.totalRevenue || 0).toLocaleString()}`, 'Gross sales']);
  rows.push(['Total Product Cost (COGS)', `Rs. ${Number(data.overview?.totalCost || 0).toLocaleString()}`, data.overview?.costsEstimated ? 'Includes estimated costs where purchase-time costs are missing' : 'Purchase-time inventory cost']);
  rows.push(['Gross Profit', `Rs. ${Number(data.overview?.grossProfit || 0).toLocaleString()}`, `${data.overview?.profitMargin || 0}% Gross Margin`]);
  rows.push(['Net Profit', `Rs. ${Number(data.overview?.netProfit || 0).toLocaleString()}`, 'Realized net profit after discounts']);
  rows.push(['Units Sold', data.overview?.totalUnitsSold || 0, 'Total physical units']);
  rows.push(['Qualifying Orders', data.overview?.qualifyingOrderCount || 0, 'Completed/Paid orders']);
  rows.push(['Inventory Asset Valuation', `Rs. ${Number(data.overview?.inventoryValuation || 0).toLocaleString()}`, 'Warehouse on-hand valuation']);
  rows.push(['Required Restock Capital', `Rs. ${Number(data.totalRestockBudget || 0).toLocaleString()}`, 'Estimated supplier replenishment cost']);
  rows.push([]);

  // Section 2: Customer Purchase Analytics (RFM & Retention)
  if (data.customerAnalytics) {
    const ca = data.customerAnalytics;
    rows.push(['=== 2. CUSTOMER PURCHASE & RETENTION ANALYTICS ===']);
    rows.push(['Distinct Buyers', ca.totalCustomers || 0]);
    rows.push(['Repeat Customers (>= 2 orders)', `${ca.repeatCustomerCount || 0} (${ca.repeatPurchaseRate || 0}%)`]);
    rows.push(['Average Order Value (AOV)', `Rs. ${Number(ca.averageOrderValue || 0).toLocaleString()}`]);
    rows.push(['Customer Lifetime Value (CLV)', `Rs. ${Number(ca.customerLifetimeValue || 0).toLocaleString()}`]);
    rows.push([]);
    rows.push(['Top Customer Accounts:']);
    rows.push(['Name', 'Email', 'Order Count', 'Total Spent (Rs.)', 'Last Purchase Date']);
    (ca.topCustomers || []).forEach((c) => {
      rows.push([c.name, c.email, c.orderCount, Number(c.totalSpent || 0).toFixed(2), c.lastOrderDate]);
    });
    rows.push([]);
  }

  // Section 3: Category Financial Performance Matrix
  if (data.categoryPerformance && data.categoryPerformance.length > 0) {
    rows.push(['=== 3. CATEGORY FINANCIAL MATRIX ===']);
    rows.push(['Category', 'Active SKUs', 'Units Sold', 'Revenue (Rs.)', 'COGS (Rs.)', 'Gross Profit (Rs.)', 'Margin %', 'Inventory Valuation (Rs.)']);
    data.categoryPerformance.forEach((cat) => {
      rows.push([
        cat.category,
        cat.activeProductsCount || 0,
        cat.unitsSold || 0,
        Number(cat.revenue || 0).toFixed(2),
        Number(cat.costOfGoods || 0).toFixed(2),
        Number(cat.grossProfit || 0).toFixed(2),
        `${cat.grossMargin || 0}%`,
        Number(cat.inventoryValuation || 0).toFixed(2),
      ]);
    });
    rows.push([]);
  }

  // Section 4: Top Performing Products
  rows.push(['=== 4. TOP PERFORMING PRODUCTS ===']);
  rows.push(['Product Name', 'Category', 'Units Sold', 'Total Revenue (Rs.)', 'Gross Profit (Rs.)']);
  if (data.topProducts && data.topProducts.length > 0) {
    data.topProducts.forEach((p) => {
      rows.push([
        p.name || 'N/A',
        p.category || 'General',
        p.unitsSold || 0,
        Number(p.revenue || 0).toFixed(2),
        Number(p.profit || 0).toFixed(2),
      ]);
    });
  } else {
    rows.push(['No purchase records recorded in this timeframe']);
  }
  rows.push([]);

  // Section 5: Dead Stock & Slow Moving SKUs
  if (data.worstProducts && data.worstProducts.length > 0) {
    rows.push(['=== 5. DEAD STOCK & SLOW MOVING INVENTORY ===']);
    rows.push(['Status', 'SKU', 'Product Name', 'Category', 'Stock Left', 'Units Sold', 'Tied-up Capital (Rs.)']);
    data.worstProducts.forEach((w) => {
      rows.push([
        w.status,
        w.sku,
        w.name,
        w.category,
        w.stock,
        w.unitsSold,
        Number(w.tiedUpCapital || 0).toFixed(2),
      ]);
    });
    rows.push([]);
  }

  // Section 6: SKU-Level Restock Forecast
  if (data.skuRestockPredictions && data.skuRestockPredictions.length > 0) {
    rows.push(['=== 6. SKU-LEVEL RESTOCK ADVISORY ===']);
    rows.push(['SKU', 'Product Name', 'Category', 'Current Stock', 'Reorder Point (ROP)', 'Needed Units', 'Unit Cost (Rs.)', 'Restock Cost (Rs.)', 'Urgency']);
    data.skuRestockPredictions.forEach((item) => {
      rows.push([
        item.sku,
        item.name,
        item.category,
        item.currentStock,
        item.reorderPoint,
        item.neededUnits,
        Number(item.unitCost || 0).toFixed(2),
        Number(item.totalRestockCost || 0).toFixed(2),
        item.urgency,
      ]);
    });
    rows.push([]);
  }

  // Convert to CSV text
  const csvContent = rows
    .map((row) => row.map(sanitizeCSV).join(','))
    .join('\r\n');

  downloadFile(csvContent, filename);
}

/**
 * 2. Export Top Products Only CSV
 */
export function exportTopProductsCSV(topProducts = [], rangeLabel = 'All Time') {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `iCrowd_Top_Products_${dateStr}.csv`;

  const rows = [
    ['iCrowd Top Selling Products Report', `Period: ${rangeLabel}`],
    [],
    ['Product Name', 'Category', 'Units Sold', 'Revenue (Rs.)', 'Est. Profit (Rs.)'],
  ];

  topProducts.forEach((p) => {
    rows.push([
      p.name || 'N/A',
      p.category || 'General',
      p.unitsSold || 0,
      Number(p.revenue || 0).toFixed(2),
      Number(p.profit || 0).toFixed(2),
    ]);
  });

  const csvContent = rows
    .map((row) => row.map(sanitizeCSV).join(','))
    .join('\r\n');

  downloadFile(csvContent, filename);
}

/**
 * 3. Export Inventory Health & Restock CSV
 */
export function exportInventoryHealthCSV(data) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `iCrowd_Inventory_Restock_Report_${dateStr}.csv`;

  const rows = [
    ['iCrowd Inventory Health & Reorder Advisory', `Date: ${dateStr}`],
    ['Total Required Restock Budget', `Rs. ${Number(data?.totalRestockBudget || 0).toLocaleString()}`],
    [],
    ['=== CATEGORY RESTOCK FORECAST ==='],
    ['Category', 'Current Stock', 'Predicted Demand', 'Recommended Reorder Units', 'Urgency'],
  ];

  (data?.restockPredictions || []).forEach((r) => {
    rows.push([
      r.category,
      r.currentStock,
      r.predictedDemand,
      r.neededUnits,
      r.urgency,
    ]);
  });

  rows.push([]);
  rows.push(['=== LOW STOCK INVENTORY ITEMS ===']);
  rows.push(['SKU', 'Product Name', 'Category', 'Stock Left', 'Status']);

  (data?.inventoryHealth?.lowStockItems || []).forEach((item) => {
    rows.push([
      item.sku,
      item.name,
      item.category,
      item.stock,
      item.status,
    ]);
  });

  const csvContent = rows
    .map((row) => row.map(sanitizeCSV).join(','))
    .join('\r\n');

  downloadFile(csvContent, filename);
}

/**
 * 4. Export Native Microsoft Excel (.xls XML format)
 */
export function exportExcelReport(data) {
  if (!data) return;
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `iCrowd_BI_Report_${dateStr}.xls`;

  // Excel HTML format
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /></head>
    <body>
      <h2>iCrowd Advanced Sales Analytics & Business Intelligence Report</h2>
      <p>Report Date: ${new Date().toLocaleString()} | Period: ${sanitizeExcelText(data.overview?.dateRangeLabel || 'All Time')}</p>
      <p>${data.overview?.costsEstimated ? 'Includes estimated costs where purchase-time costs are missing.' : 'Uses purchase-time costs.'}</p>
      
      <h3>Executive Financial Overview</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background:#0f172a; color:#ffffff; font-weight:bold;">
          <th>Revenue (LKR)</th>
          <th>COGS (LKR)</th>
          <th>Gross Profit (LKR)</th>
          <th>Net Profit (LKR)</th>
          <th>Gross Margin</th>
          <th>Units Sold</th>
          <th>Inventory Valuation</th>
          <th>Restock Budget Needed</th>
        </tr>
        <tr>
          <td>${Number(data.overview?.totalRevenue || 0).toFixed(2)}</td>
          <td>${Number(data.overview?.totalCost || 0).toFixed(2)}</td>
          <td>${Number(data.overview?.grossProfit || 0).toFixed(2)}</td>
          <td>${Number(data.overview?.netProfit || 0).toFixed(2)}</td>
          <td>${Number(data.overview?.profitMargin || 0)}%</td>
          <td>${Number(data.overview?.totalUnitsSold || 0)}</td>
          <td>${Number(data.overview?.inventoryValuation || 0).toFixed(2)}</td>
          <td>${Number(data.totalRestockBudget || 0).toFixed(2)}</td>
        </tr>
      </table>

      <h3>Category Performance Matrix</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background:#0f172a; color:#ffffff; font-weight:bold;">
          <th>Category</th><th>Units Sold</th><th>Revenue (LKR)</th><th>COGS (LKR)</th><th>Profit (LKR)</th><th>Margin</th>
        </tr>
        ${(data.categoryPerformance || []).map(c => `
          <tr>
            <td style="mso-number-format:'@'">${sanitizeExcelText(c.category)}</td>
            <td>${Number(c.unitsSold || 0)}</td>
            <td>${Number(c.revenue || 0).toFixed(2)}</td>
            <td>${Number(c.costOfGoods || 0).toFixed(2)}</td>
            <td>${Number(c.grossProfit || 0).toFixed(2)}</td>
            <td>${Number(c.grossMargin || 0)}%</td>
          </tr>
        `).join('')}
      </table>

      <h3>Top Performing Products</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr style="background:#0f172a; color:#ffffff; font-weight:bold;">
          <th>Product Name</th><th>Category</th><th>Units Sold</th><th>Revenue (LKR)</th><th>Profit (LKR)</th>
        </tr>
        ${(data.topProducts || []).map(p => `
          <tr>
            <td style="mso-number-format:'@'">${sanitizeExcelText(p.name)}</td><td style="mso-number-format:'@'">${sanitizeExcelText(p.category)}</td><td>${Number(p.unitsSold || 0)}</td><td>${Number(p.revenue || 0).toFixed(2)}</td><td>${Number(p.profit || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
  `;

  downloadFile(html, filename, 'application/vnd.ms-excel;charset=utf-8;');
}

/**
 * 5. Print / PDF Export Trigger
 */
export function triggerPrintReport() {
  window.print();
}
