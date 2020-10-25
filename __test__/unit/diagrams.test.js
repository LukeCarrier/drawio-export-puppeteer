const {launchExporter, render, exportDiagram, exportViaScreenshot} = require('../../lib/diagrams');

jest.mock('puppeteer', () => {
  const puppeteer = jest.requireActual('puppeteer');

  puppeteer.Browser = jest.fn(() => {
    return {
      close: jest.fn(),
      newPage: jest.fn(() => {
        return Promise.resolve(new puppeteer.Page());
      }),
    };
  });

  puppeteer.Page = jest.fn(() => {
    return {
      evaluate: jest.fn(),
      goto: jest.fn(),
      on: jest.fn(),
      screenshot: jest.fn(),
      setViewport: jest.fn(),
      waitForSelector: jest.fn(() => {
        return Promise.resolve(new puppeteer.ElementHandle());
      }),
    };
  });

  puppeteer.ElementHandle = jest.fn(() => {
    return {
      evaluate: jest.fn(() => {
        return Promise.resolve({
          'bounds': {
            'x': 0,
            'y': 0,
            'width': 640,
            'height': 480,
          },
          'scale': 1,
        });
      }),
    };
  });

  puppeteer.launch = jest.fn(() => {
    return Promise.resolve(new puppeteer.Browser());
  });

  return puppeteer;
});

describe('launchExporter', () => {
  it('forwards browser console messages', async () => {
    expect.assertions(2);

    const {page} = await launchExporter();

    expect(page.on).toHaveBeenCalledTimes(1);
    expect(page.on).toHaveBeenCalledWith('console', expect.any(Function));
  });

  it('sets up a timeout to close the browser after a timeout', async () => {
    jest.useFakeTimers();
    expect.assertions(4);

    const timeoutCallback = jest.fn();

    await launchExporter({
      timeout: 500,
      timeoutCallback: timeoutCallback,
    });
    jest.runAllTimers();

    expect(timeoutCallback).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
    expect(timeoutCallback).toHaveBeenCalledTimes(1);
  });
});

describe('render', () => {
  it('calls render and retrieves result information from the DOM', async () => {
    expect.assertions(2);

    const args = [Buffer.from([]), 0, 'png'];
    const {page} = await launchExporter();
    await render(page, args);

    expect(page.evaluate).toHaveBeenCalledTimes(1);
    expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function), args);
  });
});

describe('exportViaScreenshot', () => {
  it('scales the viewport according to the bounds', async () => {
    expect.assertions(2);

    const exporter = await launchExporter();
    await exportViaScreenshot(exporter, Buffer.from([]), 0, 'png');

    expect(exporter.page.setViewport).toHaveBeenCalledTimes(1);
    expect(exporter.page.setViewport).toHaveBeenCalledWith({
      width: 642,
      height: 482,
    });
  });

  it('takes a screenshot with the appropriate options', async () => {
    expect.assertions(2);

    const exporter = await launchExporter();
    await exportViaScreenshot(exporter, Buffer.from([]), 0, 'png');

    expect(exporter.page.screenshot).toHaveBeenCalledTimes(1);
    expect(exporter.page.screenshot).toHaveBeenCalledWith({
      'type': 'png',
      'width': 642,
      'height': 482,
    });
  });

  it('closes the browser without invoking the timeout callback', async () => {
    expect.assertions(3);

    const timeoutCallback = jest.fn();

    const exporter = await launchExporter({
      timeout: 500,
      timeoutCallback: timeoutCallback,
    });
    await exportViaScreenshot(exporter, Buffer.from([]), 0, 'png');

    expect(exporter.browser.close).toHaveBeenCalledTimes(1);
    expect(clearTimeout).toHaveBeenCalledWith(exporter.browserTimeout);
    expect(timeoutCallback).toHaveBeenCalledTimes(0);
  });
});

describe('exportDiagram', () => {
  it('throws on invalid format', () => {
    exportDiagram(Buffer.from([]), 0, 'tiff').catch(e => {
      expect(e.message).toMatch(/invalid format "tiff"/);
    });
  });
});
