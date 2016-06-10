import {State} from "../../state/stateObject";
import {PathNode} from "../../path/node";
import {ResolveContext} from "../../resolve/resolveContext";
import {map} from "../../common/common";
import {makeResolvables} from "../statebuilders/resolve";

export const resolveFactory = () => ({
  /**
   * This emulates most of the behavior of the ui-router 0.2.x $resolve.resolve() service API.
   * @param invocables an object, with keys as resolve names and values as injectable functions
   * @param locals key/value pre-resolved data (locals)
   * @param parent a promise for a "parent resolve"
   */
  resolve: (invocables, locals = {}, parent?) => {
    let parentNode = new PathNode(new State(<any> { params: {}, resolve: [] }));
    let node = new PathNode(new State(<any> { params: {}, resolve: [] }));
    let context = new ResolveContext([parentNode, node]);

    context.addResolvables(makeResolvables(invocables), node.state);

    const resolveData = (parentLocals) => {
      const rewrap = _locals => makeResolvables(<any> map(_locals, local => () => local));
      context.addResolvables(rewrap(parentLocals), parentNode.state);
      context.addResolvables(rewrap(locals), node.state);
      return context.resolvePath();
    };

    return parent ? parent.then(resolveData) : resolveData({});
  }
});
