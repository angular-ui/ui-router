/** @module common */ /** for typedoc */
import {map} from "./common"

export class Queue<T> {
  constructor(private _items: T[] = []) { }

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

  peekTail(): T {
    return this._items[this._items.length - 1];
  }

  peekHead(): T {
    if (this.size())
      return this._items[0];
  }
}
