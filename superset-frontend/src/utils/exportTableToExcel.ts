/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { store } from 'src/views/store';

/**
 * Export a table chart to Excel with 100% fidelity to what is displayed.
 *
 * - Column headers are read from the DOM (preserves Cyrillic / any locale).
 * - Row data comes from the Redux store (all rows, not just the visible page).
 * - Values are coerced to keep numbers as numbers in Excel.
 *
 * @param chartId  slice / chart ID
 * @param fileName desired file name (without .xlsx extension)
 */
export default function exportTableToExcel(
  chartId: string | number,
  fileName: string,
): void {
  // ---- 1. Read displayed column headers from the DOM ----
  const container = document.querySelector(`.dashboard-chart-id-${chartId}`);
  if (!container) return;

  const headerCells = container.querySelectorAll(
    'thead th .column-name, thead th',
  );
  if (!headerCells.length) return;

  // Collect visible header labels (skip empty / icon-only cells)
  const headers: string[] = [];
  headerCells.forEach(el => {
    const text = (el.textContent || '').trim();
    if (text) headers.push(text);
  });
  // Deduplicate consecutive duplicates that may come from nested selectors
  const uniqueHeaders = headers.filter(
    (h, i) => i === 0 || h !== headers[i - 1],
  );

  // ---- 2. Get ALL data rows from Redux store ----
  const state = store.getState();
  const chart = (state as Record<string, any>).charts?.[chartId];
  const queryResult = chart?.queriesResponse?.[0];

  if (!queryResult?.data?.length) return;

  const { data, colnames } = queryResult;
  const columnKeys: string[] = colnames || Object.keys(data[0]);

  // ---- 3. Build header row ----
  // Use DOM headers if count matches column keys; otherwise fall back to keys
  const displayHeaders =
    uniqueHeaders.length === columnKeys.length ? uniqueHeaders : columnKeys;

  // ---- 4. Build data rows, preserving numbers ----
  const rows = data.map((record: Record<string, unknown>) =>
    columnKeys.map(key => {
      const val = record[key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'number') return val;
      // Try to keep numeric strings as numbers in Excel
      const num = Number(val);
      if (val !== '' && Number.isFinite(num)) return num;
      return String(val);
    }),
  );

  // ---- 5. Create workbook ----
  const wsData = [displayHeaders, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-fit column widths
  ws['!cols'] = displayHeaders.map((header, colIdx) => {
    let maxLen = String(header).length;
    rows.forEach((row: (string | number)[]) => {
      const cellLen = String(row[colIdx] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(maxLen + 2, 50) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  saveAs(blob, `${fileName}.xlsx`);
}
