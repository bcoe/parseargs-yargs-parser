import { parseArgs } from '@pkgjs/parseargs';

// Tokenize argv in string form into an argv array:
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

function shouldCoerceNumber(value) {
  // Handle numeric arguments:
  return looksLikeNumber(value) && (
    Number.isSafeInteger(Math.floor(parseFloat(`${value}`)))
  );
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
    'boolean-negation': true,
    'camel-case-expansion': true,
    // Does not currently support config loaded from disk.
    // 'combine-arrays': false,
    'dot-notation': true,
    'duplicate-arguments-array': false,
    'flatten-duplicate-arrays': false,
    // Greedy arrays, i.e., --foo a b, create painful parsing issues
    // let's drop the feature:
    // 'greedy-arrays': false,
    'halt-at-non-option': false,
    // Dropping nargs in favor of simplified 'multiples' implementation.
    // 'nargs-eats-options': false,
    'negation-prefix': 'no',
    'parse-positional-numbers': true,
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
    _: [],
    $0: ''
  };
  // Process flags `--foo`, `--bar`:
  for (const [key, value] of Object.entries(parsed.flags)) {
    // Handle boolean negation:
    const negationPrefix = `${configuration['negation-prefix']}-`;
    if (configuration['boolean-negation'] && key.startsWith(negationPrefix)) {
      argv[key.slice(negationPrefix.length)] = !value;
    } else {
      argv[key] = value;
    }
  }
  // Process options with values:
  for (const [key, value] of Object.entries(parsed.values)) {
    if (value !== undefined) {
      let mungedValue = value;
      // Handle numeric arguments:
      if (shouldCoerceNumber(value, configuration) &&
        configuration['parse-numbers']) {
        mungedValue = Number(value);
      }
      argv[key] = mungedValue;
    }
  }
  // Process positionals:
  for (const value of parsed.positionals) {
    let mungedValue = value;
    if (shouldCoerceNumber(value) &&
      configuration['parse-positional-numbers']) {
      mungedValue = Number(value);
    }
    argv._.push(mungedValue);
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
