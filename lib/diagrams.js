const path = require("path");

const puppeteer = require("puppeteer");

const DEFAULT_BROWSER_TIMEOUT = 30000;
const EXPORT_URL =
  "file://" + path.normalize(path.join(__dirname, "/../export.html"));
const RESULT_INFO_SELECTOR = "#result-info";

const BORDER = 2;

const FORMAT_JPEG = "jpg";
const FORMAT_PNG = "png";
const FORMAT_SVG = "svg";
const FORMATS = [FORMAT_JPEG, FORMAT_PNG, FORMAT_SVG];

function closeBrowser(browser) {
  return async () => {
    console.warn("Closing browser from timeout");
    await browser.close();
  };
}

async function launchExporter(
  { timeout, timeoutCallback } = {
    timeout: DEFAULT_BROWSER_TIMEOUT,
  }
) {
  console.debug("Launching browser via Puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
    ],
  });

  if (timeoutCallback === undefined) {
    timeoutCallback = closeBrowser;
  }

  console.debug("Preparing a new page");
  const page = await browser.newPage();
  page.on("console", (message) => console.debug("Browser:", message.text()));

  console.debug("Navigating to the exporter");
  await page.goto(EXPORT_URL, {
    waitUntil: "networkidle0",
  });

  console.debug(`Setting up browser timeout in ${timeout} microseconds`);
  const browserTimeout = setTimeout(
    timeoutCallback.bind(null, browser),
    timeout
  );

  return { browser, browserTimeout, page };
}

async function render(page, renderArgs) {
  console.debug("Rendering diagram");
  await page.evaluate((renderArgs) => {
    render(...renderArgs);
  }, renderArgs);

  console.debug("Awaiting render result information");
  const resultInfo = await page.waitForSelector(RESULT_INFO_SELECTOR);

  const { bounds, scale, graph } = await resultInfo.evaluate((el) => {
    return {
      bounds: {
        x: parseInt(el.getAttribute("data-bounds-x")),
        y: parseInt(el.getAttribute("data-bounds-y")),
        width: parseInt(el.getAttribute("data-bounds-width")),
        height: parseInt(el.getAttribute("data-bounds-height")),
      },
      scale: parseInt(el.getAttribute("data-scale")),
    };
  });
  console.debug("Result info yields bounds", bounds, "and scale", scale);

  return { bounds, scale, graph };
}

async function setScaledViewport(page, bounds, scale) {
  const viewport = {
    width: Math.ceil(bounds.width * scale) + BORDER,
    height: Math.ceil(bounds.height * scale) + BORDER,
  };

  console.debug("Using viewport", viewport);
  page.setViewport(viewport);

  return viewport;
}

async function exportSvg(exporter, input, pageIndex) {
  const { browser, browserTimeout, page } = exporter;

  const { bounds, scale, graph } = await render(page, [
    input,
    pageIndex,
    FORMAT_SVG,
  ]);

  const svg = await page.evaluate(
    (exportArgs) => {
      exportSvg(...exportArgs);
    },
    [graph, scale]
  );

  console.debug("Closing the browser");
  await browser.close();
  clearTimeout(browserTimeout);

  return svg;
}

async function exportViaScreenshot(exporter, input, pageIndex, format) {
  const { browser, browserTimeout, page } = exporter;

  const { bounds, scale } = await render(page, [input, pageIndex, format]);
  const viewport = await setScaledViewport(page, bounds, scale);

  const screenshotOptions = { type: format, ...viewport };
  console.debug("Screenshotting the result with options", screenshotOptions);
  const data = await page.screenshot(screenshotOptions);

  console.debug("Closing the browser");
  await browser.close();
  clearTimeout(browserTimeout);

  return data;
}

async function exportDiagram(input, pageIndex, format) {
  if (!FORMATS.includes(format)) {
    throw new Error(
      `invalid format "${format}"; must be one of [${FORMATS.join(", ")}]`
    );
  }

  input = input.toString();
  const exporter = await launchExporter();

  switch (format) {
    // Have Puppeteer screenshot them for us
    case FORMAT_JPEG:
    case FORMAT_PNG:
      return exportViaScreenshot(exporter, input, pageIndex, format);

    case FORMAT_SVG:
      const exporter = await launchExporter();
      return exportSvg(exporter, input, pageIndex);
  }
}

module.exports = {
  FORMATS,
  launchExporter,
  render,
  exportViaScreenshot,
  exportDiagram,
};
