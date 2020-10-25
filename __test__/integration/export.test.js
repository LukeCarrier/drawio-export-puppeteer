const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const Jimp = require('jimp');

describe('export', () => {
  const EXPORT_URL = 'file://' + path.normalize(path.join(__dirname, '/../../export.html'));
  const FIXTURES = path.normalize(path.join(__dirname, '../fixtures'));

  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });
  afterAll(async () => await browser.close());

  beforeEach(async () => {
    page = await browser.newPage();

    await page.goto(EXPORT_URL, {
      waitUntil: 'networkidle0',
    });
  });
  afterEach(async () => await page.close());

  async function render(inputFilename, pageIndex, format) {
    const input = await fs.readFile(path.join(FIXTURES, inputFilename));

    await page.evaluate(renderArgs => {
      render(...renderArgs);
    }, [input.toString(), pageIndex, format]);
  }

  it('exports the first page of the flowchart fixture to JPEG', async () => {
    expect.assertions(1);

    await render('flowchart.drawio', 0, 'jpg');
    const screenshot = await page.screenshot();
    const converter = await Jimp.read(screenshot);
    const converted = await converter.getBufferAsync(Jimp.MIME_PNG);

    expect(converted).toMatchImageSnapshot();
  });

  it('exports the first page of the flowchart fixture to PNG', async () => {
    expect.assertions(1);

    await render('flowchart.drawio', 0, 'png');

    expect(await page.screenshot()).toMatchImageSnapshot();
  });

  it('exports the second page of the flowchart fixture to PNG', async () => {
    expect.assertions(1);

    await render('flowchart.drawio', 1, 'png');

    expect(await page.screenshot()).toMatchImageSnapshot();
  });
});
