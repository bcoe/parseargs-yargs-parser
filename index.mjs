import { parseArgs } from '@pkgjs/parseargs';

// Take an un-split argv string and tokenize it.
export function tokenizeArgString(argString) {
  if (Array.isArray(argString)) {
    return argString.map((e) => (typeof e !== 'string' ? e + '' : e));
  }

  argString = argString.trim();

  let i = 0;
  let prevC = null;
  let c = null;
  let opening = null;
  const args = [];

  for (let ii = 0; ii < argString.length; ii++) {
    prevC = c;
    c = argString.charAt(ii);

    // Split on spaces unless we're in quotes.
    if (c === ' ' && !opening) {
      if (!(prevC === ' ')) {
        i++;
      }
      continue;
    }

    // Don't split the string if we're in matching
    // opening or closing single and double quotes.
    if (c === opening) {
      opening = null;
    } else if ((c === "'" || c === '"') && !opening) {
      opening = c;
    }

    if (!args[i]) args[i] = '';
    args[i] += c;
  }

  return args;
}

function YargsParser(
  args,
  opts
) {
  if (typeof args === 'string') {
    args = tokenizeArgString(args);
  }
  const result = YargsParser.detailed(args.slice(), opts);
  return result.argv;
}
YargsParser.detailed = function(
  args,
  opts
) {
  const configuration = {
    'boolean-negation': false,
    'camel-case-expansion': false,
    'combine-arrays': false,
    'dot-notation': false,
    'duplicate-arguments-array': false,
    'flatten-duplicate-arrays': false,
    'greedy-arrays': false,
    'halt-at-non-option': false,
    'nargs-eats-options': false,
    'negation-prefix': 'no',
    'parse-positional-numbers': false,
    'parse-numbers': true,
    'populate--': false,
    'set-placeholder-key': false,
    'short-option-groups': false,
    'strip-aliased': false,
    'strip-dashed': false,
    'unknown-options-as-args': false,
    ...opts?.configuration
  };
  if (typeof args === 'string') {
    args = tokenizeArgString(args);
  }
  const parsed = parseArgs(args, opts);
  const argv = {
    _: parsed.positionals,
    $0: '',
    ...parsed.flags
  };
  for (const [key, value] of Object.entries(parsed.values)) {
    if (value !== undefined) {
      let mungedValue = value;
      const shouldCoerceNumber = looksLikeNumber(value) &&
        configuration['parse-numbers'] && (
        Number.isSafeInteger(Math.floor(parseFloat(`${value}`))));
      if (shouldCoerceNumber) {
        mungedValue = Number(value);
      }
      argv[key] = mungedValue;
    }
  }
  return {
    argv,
    error: null,
    aliases: {},
    newAliases: {},
    configuration
  };
};
YargsParser.camelCase = (str) => str;
YargsParser.decamelize = (str, joinString) => str;
function looksLikeNumber(x) {
  if (x === null || x === undefined) return false;
  // If loaded from config, may already be a number.
  if (typeof x === 'number') return true;
  // hexadecimal.
  if (/^0x[0-9a-f]+$/i.test(x)) return true;
  // Don't treat 0123 as a number; as it drops the leading '0'.
  if (/^0[^.]/.test(x)) return false;
  return /^[-]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}
YargsParser.looksLikeNumber = looksLikeNumber;
export default YargsParser;
