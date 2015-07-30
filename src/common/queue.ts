export default class Queue<T> {
  _items: Array<T>;

  constructor() {
    this._items = [];
  }

  enqueue(item: T) {
    this._items.push(item);
    return item;
  }

  dequeue(): T {
    if (this.size())
      return this._items.splice(0, 1)[0];
  }

  clear(): Array<T> {
    var current = this._items;
    this._items = [];
    return current;
  }

  size(): number {
    return this._items.length;
  }

  remove(item: T) {
    var idx = this._items.indexOf(item);
    return idx > -1 && this._items.splice(idx, 1)[0];
  }

  peek(): T {
    return this._items[this._items.length - 1];
  }
}
