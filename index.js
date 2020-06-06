const path = require('path');

const puppeteer = require('puppeteer');

const EXPORT_URL = 'file://' + path.join(__dirname, 'export.html');
const RESULT_INFO_SELECTOR = '#result-info';
const FORMATS = [
];

async function launchExporter(timeout=30000) {
  console.debug('Launching browser via Puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--disable-gpu',
      '--no-sandbox',
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

async function exportDiagram(input, pageIndex, format) {
  input = input.toString();

  switch (format) {
    default:
      throw new Error(`invalid format "${format}"; must be one of [${FORMATS.join(', ')}]`);
  }
}

module.exports = exportDiagram;
