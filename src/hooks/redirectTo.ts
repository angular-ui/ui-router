import {isString, isFunction} from "../common/predicates"
import {UIRInjector} from "../common/interface";
import {Transition} from "../transition/transition";
import {UiRouter} from "../router";
import {services} from "../common/coreservices";
import {TargetState} from "../state/targetState";

/**
 * A hook that redirects to a different state or params
 *
 * See [[StateDeclaration.redirectTo]]
 */
export const redirectToHook = (transition: Transition, $injector: UIRInjector) => {
  let redirect = transition.to().redirectTo;
  if (!redirect) return;

  let router: UiRouter = $injector.get(UiRouter);
  let $state = router.stateService;

  if (isFunction(redirect))
    return services.$q.when(redirect(transition, $injector)).then(handleResult);

  return handleResult(redirect);

  function handleResult(result) {
    if (result instanceof TargetState) return result;
    if (isString(result)) return $state.target(<any> result, transition.params(), transition.options());
    if (result['state'] || result['params'])
      return $state.target(result['state'] || transition.to(), result['params'] || transition.params(), transition.options());
  }
};