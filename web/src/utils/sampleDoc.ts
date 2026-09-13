/**
 * Generates an authentic high-resolution photograph of an angled receipt/invoice on a modern workspace desk.
 * Used for zero-configuration testing and immediate DEMO_MODE exploration.
 */
export interface SampleDocWithCorners {
  dataUrl: string;
  defaultCorners: [
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number },
    { x: number; y: number }
  ];
}

export function createSampleDocument(): SampleDocWithCorners {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 900;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      dataUrl: '',
      defaultCorners: [
        { x: 320, y: 80 },
        { x: 880, y: 120 },
        { x: 820, y: 820 },
        { x: 260, y: 780 },
      ],
    };
  }

  // 1. Dark minimalist studio desk texture
  const deskGrad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 700);
  deskGrad.addColorStop(0, '#131b2e');
  deskGrad.addColorStop(1, '#070a12');
  ctx.fillStyle = deskGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid texture on desk
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Define exact corner coordinates for the angled paper
  // Center is (600, 450). Paper is ~560 x 740, rotated slightly (-4.5 deg)
  const cTopLeft = { x: 325, y: 95 };
  const cTopRight = { x: 865, y: 135 };
  const cBottomRight = { x: 815, y: 815 };
  const cBottomLeft = { x: 275, y: 775 };

  // 3. Draw Paper Drop Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 24;

  ctx.beginPath();
  ctx.moveTo(cTopLeft.x, cTopLeft.y);
  ctx.lineTo(cTopRight.x, cTopRight.y);
  ctx.lineTo(cBottomRight.x, cBottomRight.y);
  ctx.lineTo(cBottomLeft.x, cBottomLeft.y);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // 4. Render Paper Content with Local Transform
  ctx.save();
  ctx.translate(600, 450);
  ctx.rotate(-0.075); // approx -4.3 degrees

  const paperW = 540;
  const paperH = 700;
  const pX = -paperW / 2;
  const pY = -paperH / 2;

  // Paper surface with slight subtle cream lighting
  const paperBg = ctx.createLinearGradient(pX, pY, pX + paperW, pY + paperH);
  paperBg.addColorStop(0, '#ffffff');
  paperBg.addColorStop(0.7, '#fafafa');
  paperBg.addColorStop(1, '#f3f4f6');
  ctx.fillStyle = paperBg;
  ctx.fillRect(pX, pY, paperW, paperH);

  // Subtle paper border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(pX, pY, paperW, paperH);

  // Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(pX, pY, paperW, 72);

  // Brand Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Inter, sans-serif';
  ctx.fillText('TELEDOC SYSTEMS CORP.', pX + 28, pY + 44);

  ctx.font = '500 12px Inter, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('OFFICIAL TAX INVOICE', pX + paperW - 170, pY + 44);

  // Invoice Details Grid
  ctx.fillStyle = '#1e293b';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.fillText('INVOICE NO: #INV-2026-8941', pX + 28, pY + 112);
  ctx.fillText('DATE: 13 SEPT 2026', pX + paperW - 180, pY + 112);

  ctx.fillStyle = '#64748b';
  ctx.font = '400 12px Inter, sans-serif';
  ctx.fillText('Client: Alexander Motologa', pX + 28, pY + 134);
  ctx.fillText('Payment: Telegram Pay (Instant)', pX + paperW - 180, pY + 134);

  // Divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pX + 28, pY + 156);
  ctx.lineTo(pX + paperW - 28, pY + 156);
  ctx.stroke();

  // Line items table
  const items = [
    { code: '01', desc: 'TeleDoc Mobile Scanner Pro License', qty: '1', amount: '$24.00' },
    { code: '02', desc: 'Homography Perspective Processing Core', qty: '1', amount: '$15.00' },
    { code: '03', desc: 'Bradley-Roth Adaptive Shadow Removal', qty: '1', amount: '$18.50' },
    { code: '04', desc: 'WebAssembly Multilingual OCR Engine', qty: '1', amount: '$32.00' },
    { code: '05', desc: 'Archival ISO A4 Multi-Page PDF Compiler', qty: '1', amount: '$12.00' },
  ];

  ctx.font = '600 11px Inter, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('REF', pX + 28, pY + 185);
  ctx.fillText('ITEM DESCRIPTION', pX + 70, pY + 185);
  ctx.fillText('QTY', pX + paperW - 130, pY + 185);
  ctx.fillText('AMOUNT', pX + paperW - 75, pY + 185);

  let y = pY + 220;
  for (const item of items) {
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(item.code, pX + 28, y);

    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(item.desc, pX + 70, y);

    ctx.fillStyle = '#475569';
    ctx.fillText(item.qty, pX + paperW - 120, y);

    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(item.amount, pX + paperW - 75, y);

    y += 34;
  }

  // Divider
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(pX + 28, y + 10);
  ctx.lineTo(pX + paperW - 28, y + 10);
  ctx.stroke();

  // Summary Totals
  ctx.font = '500 13px Inter, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('SUBTOTAL:', pX + paperW - 190, y + 42);
  ctx.fillText('$101.50', pX + paperW - 75, y + 42);

  ctx.fillText('VAT (0%):', pX + paperW - 190, y + 68);
  ctx.fillText('$0.00', pX + paperW - 75, y + 68);

  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('TOTAL DUE:', pX + paperW - 190, y + 100);
  ctx.fillStyle = '#2563eb';
  ctx.fillText('$101.50', pX + paperW - 75, y + 100);

  // Barcode / Verification Stamp on Left
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  for (let bx = 0; bx < 140; bx += 4) {
    const isThick = (bx % 8 === 0);
    ctx.lineWidth = isThick ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(pX + 32 + bx, y + 60);
    ctx.lineTo(pX + 32 + bx, y + 105);
    ctx.stroke();
  }
  ctx.font = '9px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('* 9 8 4 1 0 2 6 *', pX + 48, y + 120);

  // Official Seal / Red Stamp
  ctx.save();
  ctx.translate(pX + 110, y + 25);
  ctx.rotate(-0.15);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-65, -20, 130, 40);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', 0, 4);
  ctx.restore();

  // Natural shadow gradient simulating phone camera ambient lighting
  const shadowGrad = ctx.createRadialGradient(
    pX + paperW, pY, 40,
    pX + paperW, pY, 480
  );
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
  shadowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(pX, pY, paperW, paperH);

  ctx.restore();

  return {
    dataUrl: canvas.toDataURL('image/png'),
    defaultCorners: [cTopLeft, cTopRight, cBottomRight, cBottomLeft],
  };
}

export function createSampleDocumentImage(): string {
  return createSampleDocument().dataUrl;
}
