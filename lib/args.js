const arg = require('arg');

const RECOVERABLE_ERRORS = [
  'ARG_UNKNOWN_OPTION',
  'ARG_MISSING_REQUIRED',
];

function parseArgs(argSpec, options) {
  const args = {};
  Object.values(argSpec).forEach(arg => {
    args[arg.long] = arg.type;
    args[arg.short] = arg.long;
  });

  const values = arg(args, options);

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

module.exports = {
  RECOVERABLE_ERRORS,
  parseArgs,
  generateHelp,
};
