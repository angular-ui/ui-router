export default class TransitionQueue {
  _items: Array<any>;

  constructor() {
    this._items = [];
  }

  push(transition) {
    this._items.push(transition);
    return transition;
  }

  clear() {
    var current = this._items;
    this._items = [];
    return current;
  }

  size() {
    return this._items.length;
  }

  pop(transition) {
    var idx = this._items.indexOf(transition);
    return idx > -1 && this._items.splice(idx, 1)[0];
  }

  last() {
    return this._items[this._items.length - 1];
  }
}
