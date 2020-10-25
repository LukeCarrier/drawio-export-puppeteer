const {parseArgs, generateHelp} = require('../../lib/args');

const ARG_SPEC = {
  'foo': {
    'long': '--foo',
    'short': '-f',
    'type': String,
    'description': 'Foo',
  },
  'bar': {
    'long': '--bar',
    'short': '-b',
    'type': Number,
    'description': 'Bar',
  },
};

describe('parseArgs', () => {
  it('returns argument values when all are present', () => {
    const argv = ['-f', 'foo', '--bar', 42];
    const values = parseArgs(ARG_SPEC, {argv});

    expect(values).toStrictEqual({
      'foo': 'foo',
      'bar': 42,
    });
  });

  it('throws on missing args', () => {
    const argv = ['-f', 'foo'];

    expect(() => {
      parseArgs(ARG_SPEC, {argv});
    }).toThrow('Missing required option: --bar');
  });
});

describe('generateHelp', () => {
  it('generates help for all arguments', () => {
    const help = generateHelp(ARG_SPEC);

    expect(help).toMatch(/-f, --foo <foo \(String\)> +Foo/);
    expect(help).toMatch(/-b, --bar <bar \(Number\)> +Bar/);
  });
});
