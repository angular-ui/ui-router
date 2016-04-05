import {InputMetadata, ComponentMetadata} from "angular2/core";

export const ng2ComponentInputs = (ng2CompClass) => {
  /** Get "@Input('foo') _foo" inputs */
  let props = Reflect['getMetadata']('propMetadata', ng2CompClass);
  let _props = Object.keys(props || {})
      // -> { string, anno[] } tuples
      .map(key => ({ key, annoArr: props[key] }))
      // -> to { string, anno } tuples
      .reduce((acc, tuple) => acc.concat(tuple.annoArr.map(anno => ({ key: tuple.key, anno }))), [])
      // Only Inputs
      .filter(tuple => tuple.anno instanceof InputMetadata)
      // If they have a bindingPropertyName, i.e. "@Input('foo') _foo", then foo, else _foo
      .map(tuple => ({ resolve: tuple.anno.bindingPropertyName || tuple.key, prop: tuple.key }));

  /** Get "inputs: ['foo']" inputs */
  let inputs = Reflect['getMetadata']('annotations', ng2CompClass)
      // Find the ComponentMetadata class annotation
      .filter(x => x instanceof ComponentMetadata && !!x.inputs)
      // Get the .inputs string array
      .map(x => x.inputs)
      // Flatten
      .reduce((acc, arr) => acc.concat(arr), [])
      .map(input => ({ resolve: input, prop: input }));

  return _props.concat(inputs);
};