import {Glob} from "../../src/common/glob";

describe('Glob', function() {
  it('should match exact strings', function() {
    var state = 'about.person.item';

    expect(new Glob('about.person.item').matches(state)).toBe(true);
    expect(new Glob('about.person.item.foo').matches(state)).toBe(false);
    expect(new Glob('foo.about.person.item').matches(state)).toBe(false);
  });

  it('with a single wildcard (*) should match a top level state', function() {
    var glob = new Glob('*');

    expect(glob.matches('foo')).toBe(true);
    expect(glob.matches('bar')).toBe(true);
    expect(glob.matches('baz')).toBe(true);
    expect(glob.matches('foo.bar')).toBe(false);
    expect(glob.matches('.baz')).toBe(false);
  });

  it('with a single wildcard (*) should match any single non-empty segment', function() {
    var state = 'about.person.item';

    expect(new Glob('*.person.item').matches(state)).toBe(true);
    expect(new Glob('*.*.item').matches(state)).toBe(true);
    expect(new Glob('*.person.*').matches(state)).toBe(true);
    expect(new Glob('*.*.*').matches(state)).toBe(true);

    expect(new Glob('*.*.*.*').matches(state)).toBe(false);
    expect(new Glob('*.*.person.item').matches(state)).toBe(false);
    expect(new Glob('*.person.item.foo').matches(state)).toBe(false);
    expect(new Glob('foo.about.person.*').matches(state)).toBe(false);
  });

  it('with a double wildcard (**) should match any valid state name', function() {
    var glob = new Glob('**');

    expect(glob.matches('foo')).toBe(true);
    expect(glob.matches('bar')).toBe(true);
    expect(glob.matches('foo.bar')).toBe(true);
  });

  it('with a double wildcard (**) should match zero or more segments', function() {
    var state = 'about.person.item';

    expect(new Glob('**').matches(state)).toBe(true);
    expect(new Glob('**.**').matches(state)).toBe(true);
    expect(new Glob('**.*').matches(state)).toBe(true);
    expect(new Glob('**.person.item').matches(state)).toBe(true);
    expect(new Glob('**.person.**').matches(state)).toBe(true);
    expect(new Glob('**.person.**.item').matches(state)).toBe(true);
    expect(new Glob('**.person.**.*').matches(state)).toBe(true);
    expect(new Glob('**.item').matches(state)).toBe(true);
    expect(new Glob('about.**').matches(state)).toBe(true);
    expect(new Glob('about.**.person.item').matches(state)).toBe(true);
    expect(new Glob('about.person.item.**').matches(state)).toBe(true);
    expect(new Glob('**.about.person.item').matches(state)).toBe(true);
    expect(new Glob('**.about.**.person.item.**').matches(state)).toBe(true);
    expect(new Glob('**.**.about.person.item').matches(state)).toBe(true);

    expect(new Glob('**.person.**.*.*').matches(state)).toBe(false);
    expect(new Glob('**.person.**.*.item').matches(state)).toBe(false);

    // Tests for #2438
    expect(new Glob('**.todo.*').matches('awesome.edit.todo.inbox')).toBe(true);
    expect(new Glob('*.todo.*').matches('awesome.edit.todo.inbox')).toBe(false);
    expect(new Glob('**.todo.*.*').matches('awesome.edit.todo.inbox')).toBe(false);
    expect(new Glob('**.todo.**').matches('awesome.edit.todo.inbox')).toBe(true);
    expect(new Glob('**.todo.**.*').matches('awesome.edit.todo.inbox')).toBe(true);
  });
});
