/** @module common */ /** for typedoc */

export class Queue<T> {
  constructor(private _items: T[] = [], private _limit: number = null) { }

  enqueue(item: T) {
    let items = this._items;
    items.push(item);
    if (this._limit && items.length > this._limit) items.shift();
    return item;
  }

  dequeue(): T {
    if (this.size())
      return this._items.splice(0, 1)[0];
  }

  clear(): Array<T> {
    let current = this._items;
    this._items = [];
    return current;
  }

  size(): number {
    return this._items.length;
  }

  remove(item: T) {
    let idx = this._items.indexOf(item);
    return idx > -1 && this._items.splice(idx, 1)[0];
  }

  peekTail(): T {
    return this._items[this._items.length - 1];
  }

  peekHead(): T {
    if (this.size())
      return this._items[0];
  }
}
