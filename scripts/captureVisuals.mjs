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
    defaultViewport: {
      width: 440,
      height: 840,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  });

  const page = await browser.newPage();

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
  async function recordFrame(name, delayMs = 1200) {
    const buffer = await page.screenshot({ type: 'png' });
    capturedFrames.push({ buffer, delayMs });
    if (name) {
      fs.writeFileSync(path.join(imagesDir, name), buffer);
      console.log(`✓ Saved ${name}`);
    }
    return buffer;
  }

  console.log('Navigating to http://127.0.0.1:8088/?demo=true...');
  await page.goto('http://127.0.0.1:8088/?demo=true', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await waitForText('TeleDoc Scanner', 15000);
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Main Preview Screen
  console.log('\n--- 1. Main Preview Screen ---');
  await recordFrame('screenshot_preview.png', 1600);

  // 2. Crop / Corner Adjuster View
  console.log('\n--- 2. Crop / Corner Adjuster View ---');
  const cropBtn = await page.$('button[title*="crop"]');
  if (cropBtn) await cropBtn.click();
  await waitForText('Adjust Document Corners', 8000);
  await new Promise((r) => setTimeout(r, 800));
  await recordFrame('screenshot_crop.png', 1600);

  console.log('Straightening document...');
  await clickButtonWithText('Straighten');
  await waitForText('Tuning', 8000);
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Tuning Drawer
  console.log('\n--- 3. Fine-Tuning Drawer ---');
  const tuningBtn = await page.$('button[title*="threshold"]');
  if (tuningBtn) await tuningBtn.click();
  await page.waitForSelector('input[type="range"]', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 800));
  await recordFrame('screenshot_tuning.png', 1400);

  // Close tuning
  if (tuningBtn) await tuningBtn.click();
  await new Promise((r) => setTimeout(r, 500));

  // 4. Digital Signature Pad
  console.log('\n--- 4. Digital Signature Pad ---');
  const signBtn = await page.$('button[title*="Sign"]');
  if (signBtn) await signBtn.click();
  await waitForText('Digital Signature', 5000);
  await new Promise((r) => setTimeout(r, 500));

  // Draw signature on canvas
  const canvasHandle = await page.$('canvas.touch-none');
  if (canvasHandle) {
    const box = await canvasHandle.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 80, box.y + 110);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + 60, { steps: 6 });
      await page.mouse.move(box.x + 160, box.y + 130, { steps: 6 });
      await page.mouse.move(box.x + 190, box.y + 90, { steps: 5 });
      await page.mouse.move(box.x + 230, box.y + 120, { steps: 5 });
      await page.mouse.move(box.x + 280, box.y + 75, { steps: 6 });
      await page.mouse.move(box.x + 320, box.y + 135, { steps: 6 });
      await page.mouse.up();
    }
  }
  await new Promise((r) => setTimeout(r, 400));
  await recordFrame('screenshot_signature.png', 1600);

  // Click Save Signature
  await clickButtonWithText('Save Signature');
  await new Promise((r) => setTimeout(r, 800));

  // 5. Watermark / Stamp Modal
  console.log('\n--- 5. Watermark & Stamp Modal ---');
  const stampBtn = await page.$('button[title*="stamp"]');
  if (stampBtn) await stampBtn.click();
  await waitForText('Watermark', 5000);
  await new Promise((r) => setTimeout(r, 500));
  await recordFrame('screenshot_stamp.png', 1400);

  // Click Apply Stamp
  await clickButtonWithText('Apply Stamp');
  await new Promise((r) => setTimeout(r, 800));

  // 6. Preview with Placed Signature and Stamp
  console.log('\n--- 6. Document with Placed Signatures & Stamps ---');
  await recordFrame('screenshot_signed_doc.png', 1800);

  // 7. OCR Text Recognition Modal
  console.log('\n--- 7. OCR Text Recognition ---');
  const ocrBtn = await page.$('button[title*="OCR"]');
  if (ocrBtn) await ocrBtn.click();
  await waitForText('Recognized Document Text', 8000);
  // Allow time for recognition to run
  await new Promise((r) => setTimeout(r, 4000));
  await recordFrame('screenshot_ocr.png', 1800);

  // Close OCR modal
  const closeOcr = await page.$('div.fixed button.text-slate-400');
  if (closeOcr) {
    await closeOcr.click();
  } else {
    await clickButtonWithText('Close');
  }
  await new Promise((r) => setTimeout(r, 600));

  // 8. PDF Export Settings
  console.log('\n--- 8. PDF Export Settings ---');
  await clickButtonWithText('Save PDF');
  await waitForText('Export PDF Options', 8000);
  await new Promise((r) => setTimeout(r, 600));
  await recordFrame('screenshot_export.png', 1600);

  await browser.close();
  console.log('\n✓ Successfully captured all 8 screenshots into docs/images/!');

  // Now create the animated GIF from capturedFrames
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
  const targetHeight = Math.round(360 * (840 / 440));

  await page.setContent(`
    <html>
      <body style="margin:0; background: #0f172a;">
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
