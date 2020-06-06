const fs = require('fs').promises;

require('console-inject');
const arg = require('arg');
const exportDiagram = require('./index');

// Options are modelled after the Draw.io Desktop CLI; ideally we should be a
// 1:1 substitute.
const args = arg({
  // Input filename
  '--export': String,
  '-x': '--export',

  // Output filename
  '--output': String,
  '-o': '--output',

  // Page index (from 0); defaults to 0
  '--page-index': Number,
  '-p': '--page-index',

  // Diagram format; defaults to "pdf"
  '--format': String,
  '-f': '--format',
});

function handleRejection(action) {
  return function(e) {
    console.error(`${action} failed with`, e);
  };
}

fs.readFile(args['--export'], 'utf-8')
  .catch(handleRejection('reading input'))
  .then(input => exportDiagram(input, args['--page-index'], args['--format']))
  .catch(handleRejection('exporting'))
  .then(result => fs.writeFile(args['--output'], result));
