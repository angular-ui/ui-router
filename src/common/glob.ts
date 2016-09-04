/** @module common */ 
/** 
 * Matches state names using glob-like pattern strings.
 *
 * Globs can be used in specific APIs including:
 *
 * - [[StateService.is]]
 * - [[StateService.includes]]
 * - [[HookMatchCriteria.to]]
 * - [[HookMatchCriteria.from]]
 * - [[HookMatchCriteria.exiting]]
 * - [[HookMatchCriteria.retained]]
 * - [[HookMatchCriteria.entering]]
 *
 * A `Glob` string is a pattern which matches state names according to the following rules:
 *
 * ### Exact match:
 *
 * The glob `'A.B'` matches the state named exactly `'A.B'`.
 *
 * | Glob        |Matches states named|Does not match state named|
 * |:------------|:--------------------|:-----------------|
 * | `'A'`       | `'A'`               | `'B'` , `'A.C'`  |
 * | `'A.B'`     | `'A.B'`             | `'A'` , `'A.B.C'`|
 *
 * ### Single wildcard (`*`)
 *
 * A single wildcard (`*`) matches any value for *a single segment* of a state name.
 *
 * | Glob        |Matches states named  |Does not match state named |
 * |:------------|:---------------------|:--------------------------|
 * | `'A.*'`     | `'A.B'` , `'A.C'`    | `'A'` , `'A.B.C'`         |
 * | `'*'`       | `'A'` , `'Z'`        | `'A.B'` , `'Z.Y.X'`       |
 * | `'A.*.*'`   | `'A.B.C'` , `'A.X.Y'`| `'A'`, `'A.B'` , `'Z.Y.X'`|
 *
 *
 * ### Double wildcards (`**`)
 *
 * Double wildcards (`'**'`) act as a wildcard for *one or more segments*
 *
 * | Glob        |Matches states named                           |Does not match state named|
 * |:------------|:----------------------------------------------|:-------------------------|
 * | `'**'`      | `'A'` , `'A.B'`, `'Z.Y.X'`                    | (matches all states)     |
 * | `'A.**'`    | `'A.B'` , `'A.C'` , `'A.B.X'`                 | `'A'`, `'Z.Y.X'`         |
 * | `'**.login'`| `'A.login'` , `'A.B.login'` , `'Z.Y.X.login'` | `'A'` , `'login'` , `'A.login.Z'` |
 *
 */
export class Glob {
  text: string;
  glob: Array<string>;

  constructor(text: string) {
    this.text = text;
    this.glob = text.split('.');
  }

  matches(name: string) {
    let segments = name.split('.');

    // match single stars
    for (let i = 0, l = this.glob.length; i < l; i++) {
      if (this.glob[i] === '*') segments[i] = '*';
    }

    // match greedy starts
    if (this.glob[0] === '**') {
       segments = segments.slice(segments.indexOf(this.glob[1]));
       segments.unshift('**');
    }
    // match greedy ends
    if (this.glob[this.glob.length - 1] === '**') {
       segments.splice(segments.indexOf(this.glob[this.glob.length - 2]) + 1, Number.MAX_VALUE);
       segments.push('**');
    }
    if (this.glob.length != segments.length) return false;

    return segments.join('') === this.glob.join('');
  }

  static is(text: string) {
    return text.indexOf('*') > -1;
  }

  static fromString(text: string) {
    if (!this.is(text)) return null;
    return new Glob(text);
  }
}
