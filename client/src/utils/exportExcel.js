/** Export array of objects to CSV (opens in Excel) */
export function exportToExcel(data, filename, columns) {
  if (!data?.length) {
    alert('No data to export');
    return;
  }

  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  const header = cols.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    cols.map((c) => {
      let val = c.accessor
        ? c.accessor.split('.').reduce((o, k) => o?.[k], row)
        : row[c.key];
      if (c.renderExport) val = c.renderExport(val, row);
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
