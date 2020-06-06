#!/usr/bin/env node

const fs = require('fs').promises;

require('console-inject');

const {
  RECOVERABLE_ERRORS, parseArgs, generateHelp,
  handleRejection,
  exportDiagram,
} = require('../index');

// Options are modelled after the Draw.io Desktop CLI; ideally we should be a
// 1:1 substitute.
const ARG_SPEC = {
  'input': {
    'long': '--export',
    'short': '-x',
    'type': String,
    'description': 'Input filename',
  },
  'pageIndex': {
    'long': '--page-index',
    'short': '-p',
    'type': Number,
    'description': 'Page index (from 0); defaults to 0',
  },
  'output': {
    'long': '--output',
    'short': '-o',
    'type': String,
    'description': 'Output filename',
  },
  'format': {
    'long': '--format',
    'short': '-f',
    'type': String,
    'description': 'Diagram format; defaults to "pdf"',
  },
};

try {
  const {input, pageIndex, output, format} = parseArgs(ARG_SPEC);

  fs.readFile(input, 'utf-8')
    .catch(handleRejection('reading input'))
    .then(input => exportDiagram(input, pageIndex, format))
    .catch(handleRejection('exporting'))
    .then(result => fs.writeFile(output, result));
} catch (e) {
  if (RECOVERABLE_ERRORS.includes(e.code)) {
    console.error(e.message);
    process.stderr.write(generateHelp(ARG_SPEC));
    process.exit(1);
  } else {
    throw e;
  }
}
