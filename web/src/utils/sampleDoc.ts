/**
 * Generates a synthetic realistic angled invoice photo on a dark desk background.
 * Used for zero-configuration testing and immediate DEMO_MODE exploration.
 */
export function createSampleDocumentImage(): string {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 900;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Dark desk texture background
  const deskGrad = ctx.createLinearGradient(0, 0, width, height);
  deskGrad.addColorStop(0, '#1e293b');
  deskGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = deskGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle wood grain lines on desk
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 2;
  for (let i = 0; i < height; i += 28) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i + 15);
    ctx.stroke();
  }

  // 2. Draw angled paper document using transformation matrix
  ctx.save();
  // Translate to center and apply perspective-like tilt and rotation
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.08); // -4.5 degrees rotation
  ctx.transform(1, 0.05, -0.08, 0.95, 0, 0); // Shear to simulate angled photo

  const paperW = 540;
  const paperH = 720;
  const paperX = -paperW / 2;
  const paperY = -paperH / 2;

  // Paper drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 15;
  ctx.shadowOffsetY = 25;

  // Paper background with warm subtle lighting gradient
  const paperGrad = ctx.createLinearGradient(paperX, paperY, paperX + paperW, paperY + paperH);
  paperGrad.addColorStop(0, '#ffffff');
  paperGrad.addColorStop(0.7, '#f8fafc');
  paperGrad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = paperGrad;
  ctx.fillRect(paperX, paperY, paperW, paperH);

  // Reset shadow for content
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Paper header: Invoice banner
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(paperX, paperY, paperW, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('INVOICE / RECEIPT', paperX + 30, paperY + 45);

  ctx.font = '14px sans-serif';
  ctx.fillText('#INV-2026-8941', paperX + paperW - 160, paperY + 45);

  // Metadata section
  ctx.fillStyle = '#334155';
  ctx.font = '13px sans-serif';
  ctx.fillText('Billed To: Antigravity Autonomous Agent', paperX + 30, paperY + 115);
  ctx.fillText('Provider: TeleDoc Cloud Systems Inc.', paperX + 30, paperY + 140);
  ctx.fillText('Date: September 13, 2026', paperX + paperW - 200, paperY + 115);
  ctx.fillText('Payment: Telegram Pay / TON', paperX + paperW - 200, paperY + 140);

  // Divider rule
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paperX + 30, paperY + 165);
  ctx.lineTo(paperX + paperW - 30, paperY + 165);
  ctx.stroke();

  // Table items
  const items = [
    { desc: '1. Mobile Document Scanner License', qty: '1', price: '$24.00' },
    { desc: '2. Homography Perspective Flattening', qty: '1', price: '$15.00' },
    { desc: '3. Bradley-Roth Shadow Removal Engine', qty: '1', price: '$18.50' },
    { desc: '4. WebAssembly OCR Integration', qty: '1', price: '$32.00' },
    { desc: '5. Multi-Page ISO A4 PDF Assembly', qty: '1', price: '$12.00' },
  ];

  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('ITEM DESCRIPTION', paperX + 30, paperY + 195);
  ctx.fillText('QTY', paperX + paperW - 140, paperY + 195);
  ctx.fillText('AMOUNT', paperX + paperW - 75, paperY + 195);

  let currentY = paperY + 230;
  ctx.font = '13px monospace';
  ctx.fillStyle = '#0f172a';

  for (const item of items) {
    ctx.fillText(item.desc, paperX + 30, currentY);
    ctx.fillText(item.qty, paperX + paperW - 130, currentY);
    ctx.fillText(item.price, paperX + paperW - 75, currentY);
    currentY += 36;
  }

  // Divider
  ctx.beginPath();
  ctx.moveTo(paperX + 30, currentY + 15);
  ctx.lineTo(paperX + paperW - 30, currentY + 15);
  ctx.stroke();

  // Total
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('SUBTOTAL: $101.50', paperX + paperW - 200, currentY + 50);
  ctx.fillText('TAX (0%): $0.00', paperX + paperW - 200, currentY + 75);
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('TOTAL: $101.50', paperX + paperW - 200, currentY + 115);

  // Red "PAID & VERIFIED" Stamp (rotated)
  ctx.save();
  ctx.translate(paperX + 110, currentY + 80);
  ctx.rotate(-0.2);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.strokeRect(-80, -28, 160, 56);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAID & VERIFIED', 0, 7);
  ctx.restore();

  // Simulated ambient hand shadow gradient over top-right corner
  const shadowGrad = ctx.createRadialGradient(
    paperX + paperW, paperY, 30,
    paperX + paperW, paperY, 350
  );
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(paperX, paperY, paperW, paperH);

  ctx.restore();

  return canvas.toDataURL('image/png');
}
