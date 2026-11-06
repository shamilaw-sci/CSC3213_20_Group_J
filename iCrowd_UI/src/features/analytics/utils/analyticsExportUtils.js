/**
 * Helper to download CSV string as a file in browser
 */
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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

/**
 * Clean and format text for CSV cell safety
 */
function sanitizeCSV(val) {
  if (val === null || val === undefined) return '""';
  const stringVal = String(val).replace(/"/g, '""');
  return `"${stringVal}"`;
}

/**
 * 1. Export Full Executive Analytics CSV Report
 */
export function exportFullAnalyticsCSV(data) {
  if (!data) return;

  const dateStr = new Date().toISOString().slice(0, 10);
  const rangeLabel = data.overview?.dateRangeLabel || 'All Time';
  const filename = `iCrowd_Full_Analytics_${rangeLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`;

  const rows = [];

  // Header Banner
  rows.push(['iCrowd E-Commerce Business Intelligence Report']);
  rows.push(['Generated Date', new Date().toLocaleString()]);
  rows.push(['Active Filter Period', rangeLabel]);
  rows.push([]);

  // Section 1: Executive KPI Overview
  rows.push(['=== EXECUTIVE KPI OVERVIEW ===']);
  rows.push(['Metric', 'Value', 'Notes']);
  rows.push(['Total Revenue', `Rs. ${Number(data.overview?.totalRevenue || 0).toLocaleString()}`, 'Gross sales']);
  rows.push(['Total Profit', `Rs. ${Number(data.overview?.totalProfit || 0).toLocaleString()}`, `${data.overview?.profitMargin || 0}% Gross Margin`]);
  rows.push(['Units Sold', data.overview?.totalUnitsSold || 0, 'Total physical units']);
  rows.push(['Inventory Valuation', `Rs. ${Number(data.overview?.inventoryValuation || 0).toLocaleString()}`, 'Current stock valuation']);
  rows.push(['AI Predicted Next Period Revenue', `Rs. ${Number(data.overview?.predictedNextMonthRevenue || 0).toLocaleString()}`, 'Machine learning forecast']);
  rows.push(['Top Performing Category', data.overview?.topCategory || 'N/A', 'Highest volume driver']);
  rows.push(['Low Stock Items Count', data.overview?.lowStockCount || 0, 'Items needing attention']);
  rows.push([]);

  // Section 2: Top Performing Products
  rows.push(['=== TOP PERFORMING PRODUCTS ===']);
  rows.push(['Product Name', 'Category', 'Units Sold', 'Total Revenue (Rs.)', 'Est. Profit (Rs.)']);
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
    rows.push(['No top products recorded for this timeframe']);
  }
  rows.push([]);

  // Section 3: Restock & Inventory Demand Forecast
  rows.push(['=== RESTOCK & INVENTORY DEMAND PREDICTIONS ===']);
  rows.push(['Category', 'Current Warehouse Stock', 'Predicted Monthly Demand', 'Units Needed to Reorder', 'Urgency Level']);
  if (data.restockPredictions && data.restockPredictions.length > 0) {
    data.restockPredictions.forEach((r) => {
      rows.push([
        r.category || 'N/A',
        r.currentStock || 0,
        r.predictedDemand || 0,
        r.neededUnits || 0,
        r.urgency || 'Adequate',
      ]);
    });
  }
  rows.push([]);

  // Section 4: Low Stock Alert Items
  rows.push(['=== CRITICAL & LOW STOCK ALERTS ===']);
  rows.push(['SKU', 'Product Name', 'Category', 'Current Units', 'Stock Status']);
  if (data.inventoryHealth?.lowStockItems && data.inventoryHealth.lowStockItems.length > 0) {
    data.inventoryHealth.lowStockItems.forEach((item) => {
      rows.push([
        item.sku || 'N/A',
        item.name || 'N/A',
        item.category || 'N/A',
        item.stock || 0,
        item.status || 'Low Stock',
      ]);
    });
  } else {
    rows.push(['All product lines currently have adequate stock buffers']);
  }
  rows.push([]);

  // Section 5: Strategic AI Insights
  rows.push(['=== STRATEGIC AI RECOMMENDATIONS ===']);
  rows.push(['Top Growth Driver', data.opportunityInsights?.topGrowthArea || 'N/A']);
  rows.push(['Profit Optimization', data.opportunityInsights?.profitOptimization || 'N/A']);
  rows.push(['Restock Advisory', data.opportunityInsights?.restockAlert || 'N/A']);
  rows.push(['Executive AI Advice', data.aiRecommendation || 'N/A']);

  // Convert to CSV text
  const csvContent = rows
    .map((row) => row.map(sanitizeCSV).join(','))
    .join('\r\n');

  downloadCSV(csvContent, filename);
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

  downloadCSV(csvContent, filename);
}

/**
 * 3. Export Inventory Health & Restock CSV
 */
export function exportInventoryHealthCSV(data) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `iCrowd_Inventory_Restock_Report_${dateStr}.csv`;

  const rows = [
    ['iCrowd Inventory Health & Reorder Advisory', `Date: ${dateStr}`],
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

  downloadCSV(csvContent, filename);
}

/**
 * 4. Print / PDF Export Trigger
 */
export function triggerPrintReport() {
  window.print();
}
