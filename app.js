const fs = require('fs').promises;

require('console-inject');
const arg = require('arg');
const exportDiagram = require('./index');

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

function handleRejection(action) {
  return function(e) {
    console.error(`${action} failed with`, e);
  };
}

function parseArgs(argSpec) {
  const args = {};
  Object.values(argSpec).forEach(arg => {
    args[arg.long] = arg.type;
    args[arg.short] = arg.long;
  });

  const values = arg(args);

  const result = {};
  for (const [name, arg] of Object.entries(argSpec)) {
    if (!(arg.long in values)) {
      const e = new Error(`Missing required option: ${arg.long}`);
      e.code = 'ARG_MISSING_REQUIRED';
      throw e;
    }

    result[name] = values[arg.long];
  }
  return result;
}

function generateHelp(argSpec) {
  const lines = [
    'exporter [options]',
    '',
    'Options:',
  ];

  for (const [name, arg] of Object.entries(argSpec)) {
    lines.push(`  ${arg.short}, ${arg.long} <${name} (${arg.type.name})>    ${arg.description}`);
  }

  return lines.join("\n");
}

try {
  const {input, pageIndex, output, format} = parseArgs(ARG_SPEC);

  fs.readFile(input, 'utf-8')
    .catch(handleRejection('reading input'))
    .then(input => exportDiagram(input, pageIndex, format))
    .catch(handleRejection('exporting'))
    .then(result => fs.writeFile(output, result));
} catch (e) {
  if (['ARG_UNKNOWN_OPTION', 'ARG_MISSING_REQUIRED'].includes(e.code)) {
    console.error(e.message);
    process.stderr.write(generateHelp(ARG_SPEC));
    process.exit(1);
  } else {
    throw e;
  }
}
