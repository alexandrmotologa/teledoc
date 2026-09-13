import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import gifencPkg from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifencPkg;

async function main() {
  const imagesDir = path.resolve(process.cwd(), 'docs/images');
  fs.mkdirSync(imagesDir, { recursive: true });

  console.log('1. Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // ==========================================
  // PART A: CAPTURE DESKTOP PRO STUDIO VIEW
  // ==========================================
  console.log('\n--- Capturing Desktop Pro Studio View (1280x820) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
  await desktopPage.goto('http://127.0.0.1:8088/?demo=true', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await desktopPage.waitForFunction(() => document.body && document.body.innerText.includes('TeleDoc Scanner'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  const desktopBuf = await desktopPage.screenshot({ type: 'png' });
  fs.writeFileSync(path.join(imagesDir, 'screenshot_studio_desktop.png'), desktopBuf);
  console.log('✓ Saved screenshot_studio_desktop.png');
  await desktopPage.close();

  // ==========================================
  // PART B: CAPTURE MOBILE TELEGRAM MINI APP
  // ==========================================
  console.log('\n--- Capturing Mobile Telegram Mini App Workflow (420x860) ---');
  const page = await browser.newPage();
  await page.setViewport({
    width: 420,
    height: 860,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  async function waitForText(text, timeout = 10000) {
    await page.waitForFunction(
      (t) => document.body && document.body.innerText.includes(t),
      { timeout },
      text
    );
  }

  async function clickButtonWithText(text) {
    return await page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const target = buttons.find((b) => b.textContent && b.textContent.includes(t));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, text);
  }

  const capturedFrames = [];
  async function recordFrame(name, delayMs = 1400) {
    const buffer = await page.screenshot({ type: 'png' });
    capturedFrames.push({ buffer, delayMs });
    if (name) {
      fs.writeFileSync(path.join(imagesDir, name), buffer);
      console.log(`✓ Saved ${name}`);
    }
    return buffer;
  }

  await page.goto('http://127.0.0.1:8088/?demo=true', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForText('TeleDoc Scanner', 15000);
  await new Promise((r) => setTimeout(r, 1800));

  // 1. Mobile Main Preview Screen
  console.log('\n1. Mobile Preview Screen (Magic B&W)');
  await recordFrame('screenshot_preview.png', 1600);

  // 2. Corner Adjuster / Crop View
  console.log('\n2. Corner Adjuster / Crop View');
  await page.click('#btn-crop');
  await waitForText('Adjust Corners', 8000);
  await new Promise((r) => setTimeout(r, 1000));
  await recordFrame('screenshot_crop.png', 1600);

  console.log('Straightening document...');
  await page.click('#btn-confirm-crop');
  await waitForText('Tuning', 8000);
  await new Promise((r) => setTimeout(r, 1200));

  // 3. Fine-Tuning Drawer / Bottom Sheet
  console.log('\n3. Fine-Tuning Drawer');
  await page.click('#btn-tuning');
  await waitForText('Exposure & Contrast Tuning', 6000);
  await new Promise((r) => setTimeout(r, 800));
  await recordFrame('screenshot_tuning.png', 1500);

  // Close tuning drawer
  await clickButtonWithText('Done Adjusting');
  await new Promise((r) => setTimeout(r, 600));

  // 4. Digital Signature Pad
  console.log('\n4. Digital Signature Pad');
  await page.click('#btn-sign');
  await waitForText('Draw Digital Signature', 8000);
  await new Promise((r) => setTimeout(r, 600));

  // Draw smooth realistic signature directly on canvas context
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas.touch-none');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(80, 160);
    ctx.bezierCurveTo(120, 90, 150, 230, 200, 140);
    ctx.bezierCurveTo(240, 70, 270, 190, 310, 130);
    ctx.bezierCurveTo(350, 80, 390, 170, 440, 125);
    ctx.bezierCurveTo(460, 110, 500, 190, 530, 140);
    ctx.stroke();
  });
  await new Promise((r) => setTimeout(r, 500));
  await recordFrame('screenshot_signature.png', 1600);

  // Save Signature
  console.log('Applying signature...');
  await clickButtonWithText('Apply to Document');
  await new Promise((r) => setTimeout(r, 600));
  await page.waitForFunction(() => !document.body.innerText.includes('Draw Digital Signature'), { timeout: 4000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  // 5. Watermark & Stamp Modal
  console.log('\n5. Watermark & Stamp Modal');
  await page.click('#btn-stamp');
  await waitForText('Add Stamp or Watermark', 8000);
  await new Promise((r) => setTimeout(r, 600));
  await recordFrame('screenshot_stamp.png', 1400);

  // Apply Stamp
  console.log('Applying stamp...');
  await clickButtonWithText('Apply Stamp');
  await new Promise((r) => setTimeout(r, 600));
  await page.waitForFunction(() => !document.body.innerText.includes('Add Stamp or Watermark'), { timeout: 4000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  // 6. Preview with Placed Signature and Stamp
  console.log('\n6. Document with Placed Signatures & Stamps');
  await recordFrame('screenshot_signed_doc.png', 1800);

  // 7. OCR Text Recognition Modal
  console.log('\n7. OCR Text Recognition');
  await page.click('#btn-ocr');
  await waitForText('Recognized Document Text', 8000);
  console.log('Waiting for OCR recognition pipeline...');
  await new Promise((r) => setTimeout(r, 5000));
  await recordFrame('screenshot_ocr.png', 1800);

  // Close OCR modal
  console.log('Closing OCR modal...');
  await page.evaluate(() => {
    const closeBtn = document.querySelector('div.fixed button svg.lucide-x')?.closest('button');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForFunction(() => !document.body.innerText.includes('Recognized Document Text'), { timeout: 4000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 800));

  // 8. PDF Export Settings Modal
  console.log('\n8. PDF Export Options');
  await page.click('#btn-export-pdf');
  await waitForText('Export PDF Options', 8000);
  await new Promise((r) => setTimeout(r, 700));
  await recordFrame('screenshot_export.png', 1600);

  await browser.close();
  console.log('\n✓ Successfully captured all HD screenshots into docs/images/!');

  // ==========================================
  // PART C: ASSEMBLE ANIMATED DEMO GIF
  // ==========================================
  console.log('\nAssembling animated demo GIF...');
  await createAnimatedGif(capturedFrames, path.join(imagesDir, 'demo_walkthrough.gif'));
}

async function createAnimatedGif(frames, outputPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const targetWidth = 360;
  const targetHeight = Math.round(360 * (860 / 420));

  await page.setContent(`
    <html>
      <body style="margin:0; background: #070a12;">
        <canvas id="c" width="${targetWidth}" height="${targetHeight}"></canvas>
      </body>
    </html>
  `);

  const gif = GIFEncoder();

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const base64 = frame.buffer.toString('base64');
    const rgba = await page.evaluate(
      async (b64, w, h) => {
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        await new Promise((res) => {
          img.onload = res;
          img.src = 'data:image/png;base64,' + b64;
        });
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        return Array.from(imgData.data);
      },
      base64,
      targetWidth,
      targetHeight
    );

    const u8Rgba = new Uint8Array(rgba);
    const palette = quantize(u8Rgba, 128);
    const index = applyPalette(u8Rgba, palette);
    gif.writeFrame(index, targetWidth, targetHeight, {
      palette,
      delay: frame.delayMs,
    });
    console.log(`Encoded GIF frame ${i + 1}/${frames.length}`);
  }

  gif.finish();
  const gifBytes = gif.bytes();
  fs.writeFileSync(outputPath, Buffer.from(gifBytes));
  await browser.close();
  console.log(`✓ Successfully generated demo_walkthrough.gif (${Math.round(gifBytes.length / 1024)} KB)!`);
}

main().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
