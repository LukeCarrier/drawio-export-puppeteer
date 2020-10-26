const { configureToMatchImageSnapshot } = require("jest-image-snapshot");

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  failureThresholdType: "percent",
  failureThreshold: 0.005,
});
expect.extend({ toMatchImageSnapshot });
