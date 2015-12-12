var uiRouter = require('ui-router');
var Glob = uiRouter.state.Glob;

describe('Glob', function() {
  it('should match glob strings', function() {
    expect(Glob.is('*')).toBe(true);
    expect(Glob.is('**')).toBe(true);
    expect(Glob.is('*.*')).toBe(true);

    expect(Glob.is('')).toBe(false);
    expect(Glob.is('.')).toBe(false);
  });

  it('should construct glob matchers', function() {
    expect(Glob.fromString('')).toBeNull();

    var state = 'about.person.item';

    expect(Glob.fromString('*.person.*').matches(state)).toBe(true);
    expect(Glob.fromString('*.person.**').matches(state)).toBe(true);

    expect(Glob.fromString('**.item.*').matches(state)).toBe(false);
    expect(Glob.fromString('**.item').matches(state)).toBe(true);
    expect(Glob.fromString('**.stuff.*').matches(state)).toBe(false);
    expect(Glob.fromString('*.*.*').matches(state)).toBe(true);

    expect(Glob.fromString('about.*.*').matches(state)).toBe(true);
    expect(Glob.fromString('about.**').matches(state)).toBe(true);
    expect(Glob.fromString('*.about.*').matches(state)).toBe(false);
    expect(Glob.fromString('about.*.*').matches(state)).toBe(true);
  });
});
