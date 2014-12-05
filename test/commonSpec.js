describe('_-like filter', function() {
  it("should filter arrays", function() {
    var input = [ 1, 2, 3, 4, 5 ];
    var filtered = filter(input, function(int) { return int > 2; });
    expect(filtered.length).toBe(3);
    expect(filtered).toEqual([ 3, 4, 5 ]);
  });

  it("should filter objects", function() {
    var input = { foo: 1, bar: 2, baz: 3, qux: 4 };
    var filtered = filter(input, function(val, key) { return val > 2; });
    expect(Object.keys(filtered).length).toBe(2);
    expect(filtered).toEqual({ baz: 3, qux: 4 });
  });
});