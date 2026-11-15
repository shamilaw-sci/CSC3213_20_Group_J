import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCSV, sanitizeExcelText } from '../../src/features/analytics/utils/analyticsExportUtils.js';

test('spreadsheet exports neutralize formulas, including leading controls and whitespace', () => {
  for (const value of ['=HYPERLINK("https://example.com")', '+1+1', '-1+1', '@SUM(1)', '\t=1+1', '\r\n +1', '\u0001@SUM(1)', '\uFEFF=1']) {
    assert.ok(sanitizeCSV(value).startsWith('"\''), value);
    assert.ok(sanitizeExcelText(value).startsWith('&#39;'), value);
  }
});
test('CSV keeps numeric losses and escapes quoted multiline product names', () => {
  assert.equal(sanitizeCSV(-123.5), '"-123.5"');
  assert.equal(sanitizeCSV('He said "hi"\nKeyboard'), '"He said ""hi""\nKeyboard"');
  assert.equal(sanitizeCSV(null), '""');
});
test('Excel export cannot inject markup through product or category names', () => {
  assert.equal(sanitizeExcelText('<img src=x onerror="alert(1)"> &'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp;');
});
