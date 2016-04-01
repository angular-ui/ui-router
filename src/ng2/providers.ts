import {Provider, provide} from "angular2/core";
import {UIRouter} from "../router";
import {Node} from "../path/node";
import {StateRegistry} from "../state/stateRegistry";
import {StateService} from "../state/stateService";
import {TransitionService} from "../transition/transitionService";
import {UrlMatcherFactory} from "../url/urlMatcherFactory";
import {UrlRouter} from "../url/urlRouter";
import {ViewService} from "../view/view";
import {UiView} from "./uiView";
import {ng2ViewsBuilder, Ng2ViewConfig} from "./viewsBuilder";
import {Ng2ViewDeclaration} from "./interface";

export const UIROUTER_PROVIDERS: Provider[] = [

  provide(UIRouter, { useFactory: () => {
    let router = new UIRouter();

    router.viewService.viewConfigFactory("ng2", (node: Node, config: Ng2ViewDeclaration) => new Ng2ViewConfig(node, config));
    router.stateRegistry.decorator('views', ng2ViewsBuilder);
    router.stateRegistry.stateQueue.autoFlush(router.stateService);

    return router;
  } }),

  provide(StateService, { useFactory: (r: UIRouter) => { return r.stateService; }, deps: [UIRouter]}),

  provide(TransitionService, { useFactory: (r: UIRouter) => { return r.transitionService; }, deps: [UIRouter]}),

  provide(UrlMatcherFactory, { useFactory: (r: UIRouter) => { return r.urlMatcherFactory; }, deps: [UIRouter]}),

  provide(UrlRouter, { useFactory: (r: UIRouter) => { return r.urlRouter; }, deps: [UIRouter]}),

  provide(ViewService, { useFactory: (r: UIRouter) => { return r.viewService; }, deps: [UIRouter]}),

  provide(StateRegistry, { useFactory: (r: UIRouter) => { return r.stateRegistry; }, deps: [UIRouter]}),

  provide(UiView.INJECT.context, { useFactory: (r: StateRegistry) => { console.log(r); return r.root(); }, deps: [StateRegistry]} ),

  provide(UiView.INJECT.fqn, { useValue: null })

];

