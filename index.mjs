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

const yargsParser = function Parser(
  args,
  opts
) {
  if (typeof args === 'string') {
    args = tokenizeArgString(args);
  }
  const result = yargsParser.detailed(args.slice(), opts);
  return result.argv;
};
yargsParser.detailed = function(
  args,
  opts
) {
  const configuration = {
    /** Should variables prefixed with --no be treated as negations? Default is `true` */
    'boolean-negation': false,
    /** Should hyphenated arguments be expanded into camel-case aliases? Default is `true` */
    'camel-case-expansion': false,
    /** Should arrays be combined when provided by both command line arguments and a configuration file? Default is `false`  */
    'combine-arrays': false,
    /** Should keys that contain `.` be treated as objects? Default is `true` */
    'dot-notation': false,
    /** Should arguments be coerced into an array when duplicated? Default is `true` */
    'duplicate-arguments-array': false,
    /** Should array arguments be coerced into a single array when duplicated? Default is `true` */
    'flatten-duplicate-arrays': false,
    /** Should arrays consume more than one positional argument following their flag? Default is `true` */
    'greedy-arrays': false,
    /** Should parsing stop at the first text argument? This is similar to how e.g. ssh parses its command line. Default is `false` */
    'halt-at-non-option': false,
    /** Should nargs consume dash options as well as positional arguments? Default is `false` */
    'nargs-eats-options': false,
    /** The prefix to use for negated boolean variables. Default is `'no-'` */
    'negation-prefix': 'no',
    /** Should positional values that look like numbers be parsed? Default is `true` */
    'parse-positional-numbers': false,
    /** Should keys that look like numbers be treated as such? Default is `true` */
    'parse-numbers': true,
    /** Should unparsed flags be stored in -- or _? Default is `false` */
    'populate--': false,
    /** Should a placeholder be added for keys not set via the corresponding CLI argument? Default is `false` */
    'set-placeholder-key': false,
    /** Should a group of short-options be treated as boolean flags? Default is `true` */
    'short-option-groups': false,
    /** Should aliases be removed before returning results? Default is `false` */
    'strip-aliased': false,
    /** Should dashed keys be removed before returning results? This option has no effect if camel-case-expansion is disabled. Default is `false` */
    'strip-dashed': false,
    /** Should unknown options be treated like regular arguments? An unknown option is one that is not configured in opts. Default is `false` */
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
      const shouldCoerceNumber = looksLikeNumber(value) && configuration['parse-numbers'] && (
        Number.isSafeInteger(Math.floor(parseFloat(`${value}`)))
      );
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
yargsParser.camelCase = (str) => str;
yargsParser.decamelize = (str, joinString) => str;
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
yargsParser.looksLikeNumber = looksLikeNumber;
export default yargsParser;
