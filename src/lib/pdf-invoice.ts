// src/lib/pdf-invoice.ts
// ─── PDF Invoice Generator ────────────────────────────────────────────────────
// Generates an HTML string that gets rendered to PDF via browser print / CSS
// media queries. The /api/bookings/[id]/invoice endpoint returns it as
// text/html with print styles — user can Ctrl+P / "Save as PDF".
// No external dependencies required.
import { BUSINESS_TIMEZONE } from "@/lib/utils";

export interface InvoiceData {
  bookingRef: string;
  invoiceDate: Date;
  // Business info
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessVatId?: string;
  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  // Booking info
  carName: string;
  carYear?: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: Date;
  dropoffDateTime: Date;
  durationDays: number;
  pricingTier: string;
  // Pricing lines
  basePricePerDay: number;
  subtotal: number;
  extrasTotal: number;
  pickupFee: number;
  dropoffFee: number;
  discount: number;
  couponCode?: string | null;
  vatRate: number;
  vatAmount: number;
  depositAmount: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  extras: Array<{ name: string; total: number }>;
}

function fmt(n: number) {
  return `€${n.toFixed(2)}`;
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

function fmtDateShort(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const vatPct = Math.round(data.vatRate * 100);
  const invoiceDateStr = fmtDateShort(data.invoiceDate);

  const extraRows = data.extras.length > 0
    ? data.extras.map(e => `
        <tr>
          <td style="padding:6px 10px;color:#555;">${e.name}</td>
          <td style="padding:6px 10px;text-align:right;color:#555;">${fmt(e.total)}</td>
        </tr>`).join("")
    : "";

  const couponRow = data.couponCode && data.discount > 0
    ? `<tr>
        <td style="padding:6px 10px;color:#16a34a;">Discount (${data.couponCode})</td>
        <td style="padding:6px 10px;text-align:right;color:#16a34a;">-${fmt(data.discount)}</td>
       </tr>`
    : "";

  const pickupFeeRow = data.pickupFee > 0
    ? `<tr><td style="padding:6px 10px;color:#555;">Pickup fee</td><td style="padding:6px 10px;text-align:right;color:#555;">${fmt(data.pickupFee)}</td></tr>`
    : "";

  const dropoffFeeRow = data.dropoffFee > 0
    ? `<tr><td style="padding:6px 10px;color:#555;">Drop-off fee</td><td style="padding:6px 10px;text-align:right;color:#555;">${fmt(data.dropoffFee)}</td></tr>`
    : "";

  const vatRow = data.vatAmount > 0
    ? `<tr style="border-top:1px solid #e5e7eb;">
        <td style="padding:8px 10px;color:#374151;">VAT (${vatPct}%)</td>
        <td style="padding:8px 10px;text-align:right;color:#374151;">${fmt(data.vatAmount)}</td>
       </tr>`
    : "";

  const pricingTierLabel =
    data.pricingTier === "monthly" ? "Monthly rate"
    : data.pricingTier === "weekly" ? "Weekly rate"
    : data.pricingTier === "seasonal" ? "Seasonal rate"
    : "Daily rate";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${data.bookingRef} – AutoKos</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #1a1a2e; }
  .logo { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
  .logo span { color: #c0392b; }
  .invoice-meta { text-align: right; }
  .invoice-meta h1 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
  .invoice-meta p { font-size: 12px; color: #6b7280; }
  .invoice-meta .ref { font-family: monospace; font-weight: 700; color: #c0392b; font-size: 16px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
  .info-block p { font-size: 13px; color: #374151; line-height: 1.6; }
  .info-block p strong { color: #111827; font-weight: 600; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f9fafb; padding: 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; text-align: left; }
  th:last-child { text-align: right; }
  td { border-bottom: 1px solid #f3f4f6; }
  .totals-table { max-width: 380px; margin-left: auto; }
  .totals-table td { border: none; font-size: 14px; }
  .total-row td { font-size: 16px; font-weight: 700; color: #1a1a2e; padding-top: 12px; border-top: 2px solid #1a1a2e; }
  .status-paid { background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .status-unpaid { background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
  .deposit-note { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 12px; color: #0369a1; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
    @page { margin: 1cm; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">Auto<span>Kos</span></div>
    <div style="margin-top:8px;">
      <p style="font-size:12px;color:#6b7280;">${data.businessAddress}</p>
      <p style="font-size:12px;color:#6b7280;">${data.businessPhone} · ${data.businessEmail}</p>
      ${data.businessVatId ? `<p style="font-size:12px;color:#6b7280;">VAT ID: ${data.businessVatId}</p>` : ""}
    </div>
  </div>
  <div class="invoice-meta">
    <h1>INVOICE / RECEIPT</h1>
    <p class="ref">${data.bookingRef}</p>
    <p style="margin-top:4px;">Date: ${invoiceDateStr}</p>
    <p style="margin-top:6px;">
      ${data.paymentStatus === "PAID"
        ? `<span class="status-paid">Paid</span>`
        : `<span class="status-unpaid">${data.paymentStatus.replace("_", " ")}</span>`}
    </p>
  </div>
</div>

<div class="grid">
  <div class="info-block">
    <p class="section-label">From</p>
    <p><strong>${data.businessName}</strong></p>
    <p>${data.businessAddress}</p>
    <p>${data.businessEmail}</p>
  </div>
  <div class="info-block">
    <p class="section-label">To</p>
    <p><strong>${data.customerName}</strong></p>
    <p>${data.customerEmail}</p>
    ${data.customerPhone ? `<p>${data.customerPhone}</p>` : ""}
    ${data.customerAddress ? `<p>${data.customerAddress}</p>` : ""}
  </div>
</div>

<hr class="divider">

<p class="section-label" style="margin-bottom:12px;">Rental Details</p>
<table>
  <thead>
    <tr>
      <th>Description</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 10px;font-weight:600;color:#111827;">${data.carName}${data.carYear ? ` (${data.carYear})` : ""}</td>
      <td style="padding:10px 10px;text-align:right;color:#374151;">${pricingTierLabel}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;color:#555;">Pickup</td>
      <td style="padding:6px 10px;text-align:right;color:#555;">${fmtDate(data.pickupDateTime)} · ${data.pickupLocation}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;color:#555;">Drop-off</td>
      <td style="padding:6px 10px;text-align:right;color:#555;">${fmtDate(data.dropoffDateTime)} · ${data.dropoffLocation}</td>
    </tr>
    <tr>
      <td style="padding:6px 10px;color:#555;">Duration</td>
      <td style="padding:6px 10px;text-align:right;color:#555;">${data.durationDays} day${data.durationDays !== 1 ? "s" : ""}</td>
    </tr>
  </tbody>
</table>

<hr class="divider">

<p class="section-label" style="margin-bottom:12px;">Price Breakdown</p>
<table class="totals-table">
  <tbody>
    <tr>
      <td style="padding:6px 10px;color:#555;">${fmt(data.basePricePerDay)}/day × ${data.durationDays} days</td>
      <td style="padding:6px 10px;text-align:right;color:#555;">${fmt(data.subtotal)}</td>
    </tr>
    ${extraRows}
    ${pickupFeeRow}
    ${dropoffFeeRow}
    ${couponRow}
    <tr style="border-top:1px solid #e5e7eb;">
      <td style="padding:8px 10px;color:#374151;">Subtotal (excl. VAT)</td>
      <td style="padding:8px 10px;text-align:right;color:#374151;">${fmt(data.totalAmount - data.vatAmount)}</td>
    </tr>
    ${vatRow}
    <tr class="total-row">
      <td style="padding:12px 10px;">Total</td>
      <td style="padding:12px 10px;text-align:right;color:#c0392b;">${fmt(data.totalAmount)}</td>
    </tr>
  </tbody>
</table>

<div class="deposit-note">
  <strong>Security deposit:</strong> ${fmt(data.depositAmount)} — Pre-authorised at vehicle pickup, not charged on this invoice.
</div>

<hr class="divider">

<div class="footer">
  <p>${data.businessName} · ${data.businessAddress}</p>
  <p style="margin-top:4px;">Thank you for choosing AutoKos. For queries about this invoice, contact us at ${data.businessEmail}</p>
  ${data.businessVatId ? `<p style="margin-top:4px;">VAT ID: ${data.businessVatId} · Kosovo VAT (${vatPct}%) included in total amount</p>` : ""}
</div>

<div class="no-print" style="margin-top:32px;text-align:center;">
  <button onclick="window.print()" style="background:#1a1a2e;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-right:12px;">
    🖨 Print / Save as PDF
  </button>
  <button onclick="window.close()" style="background:#f3f4f6;color:#374151;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
    Close
  </button>
</div>

</body>
</html>`;
}
