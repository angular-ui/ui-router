import {State} from "../../state/stateObject";
import {Node} from "../../path/node";
import {ResolveContext} from "../../resolve/resolveContext";
import {Resolvable} from "../../resolve/resolvable";
import {map} from "../../common/common";

export const resolveFactory = () => ({
  /**
   * This emulates most of the behavior of the ui-router 0.2.x $resolve.resolve() service API.
   * @param invocables an object, with keys as resolve names and values as injectable functions
   * @param locals key/value pre-resolved data (locals)
   * @param parent a promise for a "parent resolve"
   */
  resolve: (invocables, locals = {}, parent?) => {
    let parentNode = new Node(new State(<any> { params: {} }));
    let node = new Node(new State(<any> { params: {} }));
    let context = new ResolveContext([parentNode, node]);

    context.addResolvables(Resolvable.makeResolvables(invocables), node.state);

    const resolveData = (parentLocals) => {
      const rewrap = _locals => Resolvable.makeResolvables(<any> map(_locals, local => () => local));
      context.addResolvables(rewrap(parentLocals), parentNode.state);
      context.addResolvables(rewrap(locals), node.state);
      return context.resolvePath();
    };

    return parent ? parent.then(resolveData) : resolveData({});
  }
});
