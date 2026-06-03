export function calcLineItem(item) {
  const qty = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const discount = Number(item.discount) || 0;
  const gstRate = Number(item.gstRate) || 18;
  const base = qty * rate * (1 - discount / 100);
  const tax = base * gstRate / 100;
  return {
    ...item,
    quantity: qty,
    rate,
    discount,
    gstRate,
    amount: Math.round(base * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    cgst: Math.round(tax / 2 * 100) / 100,
    sgst: Math.round(tax / 2 * 100) / 100,
    total: Math.round((base + tax) * 100) / 100,
  };
}

export function calcOrderTotals(items) {
  const lines = items.map(calcLineItem);
  const subtotal = lines.reduce((s, i) => s + i.amount, 0);
  const taxTotal = lines.reduce((s, i) => s + i.tax, 0);
  const discountTotal = lines.reduce((s, i) => s + (i.quantity * i.rate * (i.discount / 100)), 0);
  return {
    items: lines,
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    grandTotal: Math.round((subtotal + taxTotal) * 100) / 100,
  };
}

export function calcInvoiceTotals(items) {
  const result = calcOrderTotals(items);
  const cgstTotal = result.items.reduce((s, i) => s + i.cgst, 0);
  const sgstTotal = result.items.reduce((s, i) => s + i.sgst, 0);
  return { ...result, cgstTotal, sgstTotal };
}
