const path = require('path');

const puppeteer = require('puppeteer');

const EXPORT_URL = 'file://' + path.join(__dirname, 'export.html');
const RESULT_INFO_SELECTOR = '#result-info';
const FORMATS = [
  'jpg',
  'png',
];

async function launchExporter(timeout=30000) {
  console.debug('Launching browser via Puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  console.debug('Preparing a new page');
  const page = await browser.newPage();
  page.on('console', message => console.debug('Browser:', message.text()));

  console.debug('Navigating to the exporter');
  await page.goto(EXPORT_URL, {
    waitUntil: 'networkidle0',
  });

  console.debug(`Setting up browser timeout in ${timeout} microseconds`);
  const browserTimeout = setTimeout(() => {
    console.warn('Closing browser from timeout');
    browser.close();
  }, timeout);

  return {browser, browserTimeout, page};
}

async function exportViaScreenshot(input, pageIndex, format) {
  const {browser, browserTimeout, page} = await launchExporter();

  console.debug('Rendering diagram');
  await page.evaluate(renderArgs => {
    render(...renderArgs);
  }, [input, pageIndex, format]);

  console.debug('Awaiting render result information');
  const resultInfo = await page.waitForSelector(RESULT_INFO_SELECTOR);

  const {bounds, scale} = await resultInfo.evaluate(el => {
    return {
      bounds: {
        x: parseInt(el.getAttribute('data-bounds-x')),
        y: parseInt(el.getAttribute('data-bounds-y')),
        width: parseInt(el.getAttribute('data-bounds-width')),
        height: parseInt(el.getAttribute('data-bounds-height')),
      },
      scale: parseInt(el.getAttribute('data-scale')),
    }
  });
  console.debug('Result info yields bounds', bounds, 'and scale', scale);
  const viewport = {
    width: Math.ceil(bounds.width * scale) + 2,
    height: Math.ceil(bounds.height * scale) + 2,
  };
  console.debug('Using viewport', viewport);
  page.setViewport(viewport);

  const screenshotOptions = {
    type: format === 'jpg' ? 'jpeg' : format,
    ...viewport,
  };
  console.debug('Screenshotting the result with options', screenshotOptions);
  const data = await page.screenshot(screenshotOptions);

  console.debug('Closing the browser');
  await browser.close();
  clearTimeout(browserTimeout);

  return data;
}

async function exportDiagram(input, pageIndex, format) {
  input = input.toString();

  switch (format) {
    // Have Puppeteer screenshot them for us
    case 'jpg':
    case 'png':
      return exportViaScreenshot(input, pageIndex, format);

    default:
      throw new Error(`invalid format "${format}"; must be one of [${FORMATS.join(', ')}]`);
  }
}

module.exports = exportDiagram;
