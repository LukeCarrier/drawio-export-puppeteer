const FORMATS = [
];

async function exportDiagram(input, pageIndex, format) {
  input = input.toString();

  switch (format) {
    default:
      throw new Error(`invalid format "${format}"; must be one of [${FORMATS.join(', ')}]`);
  }
}

module.exports = exportDiagram;
