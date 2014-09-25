describe('common', function() {
  describe('GlobBuilder', function() {
    it('should match glob strings', function() {
      expect(GlobBuilder.is('*')).toBe(true);
      expect(GlobBuilder.is('**')).toBe(true);
      expect(GlobBuilder.is('*.*')).toBe(true);

      expect(GlobBuilder.is('')).toBe(false);
      expect(GlobBuilder.is('.')).toBe(false);
    });

    it('should construct glob matchers', function() {
      expect(GlobBuilder.fromString('')).toBeNull();

      var state = { name: 'about.person.item' };

      expect(GlobBuilder.fromString('*.person.*').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('*.person.**').matches(state)).toBe(true);

      expect(GlobBuilder.fromString('**.item.*').matches(state)).toBe(false);
      expect(GlobBuilder.fromString('**.item').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('**.stuff.*').matches(state)).toBe(false);
      expect(GlobBuilder.fromString('*.*.*').matches(state)).toBe(true);

      expect(GlobBuilder.fromString('about.*.*').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('about.**').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('*.about.*').matches(state)).toBe(false);
      expect(GlobBuilder.fromString('about.*.*').matches(state)).toBe(true);
    });
  });
});