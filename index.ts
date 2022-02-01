import {parseArgs} from '@pkgjs/parseargs';
import {Arguments, DetailedArguments, Options} from 'yargs-parser';

export type ArgsInput = string | any[];

interface Parser {
  (args: ArgsInput, opts?: Partial<Options>): Arguments;
  detailed(args: ArgsInput, opts?: Partial<Options>): DetailedArguments;
  camelCase(str: string): string;
  decamelize(str: string, joinString?: string): string;
  looksLikeNumber(x: null | undefined | number | string): boolean;
}

// take an un-split argv string and tokenize it.
export function tokenizeArgString (argString: string | any[]): string[] {
  if (Array.isArray(argString)) {
    return argString.map(e => typeof e !== 'string' ? e + '' : e)
  }

  argString = argString.trim()

  let i = 0
  let prevC: string | null = null
  let c: string | null = null
  let opening: string | null = null
  const args: string[] = []

  for (let ii = 0; ii < argString.length; ii++) {
    prevC = c
    c = argString.charAt(ii)

    // split on spaces unless we're in quotes.
    if (c === ' ' && !opening) {
      if (!(prevC === ' ')) {
        i++
      }
      continue
    }

    // don't split the string if we're in matching
    // opening or closing single and double quotes.
    if (c === opening) {
      opening = null
    } else if ((c === "'" || c === '"') && !opening) {
      opening = c
    }

    if (!args[i]) args[i] = ''
    args[i] += c
  }

  return args
}

const yargsParser: Parser = function Parser(
  args: ArgsInput,
  opts?: Partial<Options>
): Arguments {
  if (typeof args === 'string') {
    args = tokenizeArgString(args);
  }
  const result = yargsParser.detailed(args.slice(), opts);
  return result.argv;
};
yargsParser.detailed = function (
  args: ArgsInput,
  opts?: Partial<Options>
): DetailedArguments {
  if (typeof args === 'string') {
    args = tokenizeArgString(args);
  }
  const parsed = parseArgs(args as string[]);
  console.info(parsed);
  return {
    argv: Object.assign({_: parsed.positionals, $0: ''}, parsed.flags),
    error: null,
    aliases: {},
    newAliases: {},
    configuration: {
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
      'parse-numbers': false,
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
    },
  };
};
yargsParser.camelCase = (str: string) => str;
yargsParser.decamelize = (str: string, joinString?: string) => str;
yargsParser.looksLikeNumber = (x: null | undefined | number | string) => true;
export default yargsParser;
