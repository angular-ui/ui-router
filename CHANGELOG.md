<a name="1.0.0-beta.2"></a>
# [1.0.0-beta.2](https://github.com/angular-ui/ui-router/compare/1.0.0-alpha.5...v1.0.0-beta.2) (2016-09-09)

[Read more on the blog](

### Features

#### Core

* **lazyLoad:** Add state.lazyLoad hook to lazy load a tree of states ([bef5257](https://github.com/angular-ui/ui-router/commit/bef5257)) ([8ecb6c6](https://github.com/angular-ui/ui-router/commit/8ecb6c6)), closes [#146](https://github.com/angular-ui/ui-router/issues/146) [#2739](https://github.com/angular-ui/ui-router/issues/2739)
* **StateRegistry:** Add `deregister` method. ([44579ec](https://github.com/angular-ui/ui-router/commit/44579ec)), closes [#1095](https://github.com/angular-ui/ui-router/issues/1095) [#2711](https://github.com/angular-ui/ui-router/issues/2711)
* **redirectTo:** Process `redirectTo` property of a state as a redirect string/object/hook function ([6becb12](https://github.com/angular-ui/ui-router/commit/6becb12)), closes [#27](https://github.com/angular-ui/ui-router/issues/27) [#948](https://github.com/angular-ui/ui-router/issues/948)
* **redirect:** Error after 20+ redirected transitions ([88052bf](https://github.com/angular-ui/ui-router/commit/88052bf))
* **rejectFactory:** separate transition aborted and transition errored reject types ([55995fd](https://github.com/angular-ui/ui-router/commit/55995fd))
* **Resolve:** support ng2-like provide object literals ([a7e5ea6](https://github.com/angular-ui/ui-router/commit/a7e5ea6))
* **Resolve:** Switch state.resolve to be an array of Resolvables ([6743a60](https://github.com/angular-ui/ui-router/commit/6743a60))
* **Transition:** Add the transition source (url/sref) to TransitionOptions ([5d42d79](https://github.com/angular-ui/ui-router/commit/5d42d79))
* **Transition:** Added `getResolvable(token)` method ([3aee2b7](https://github.com/angular-ui/ui-router/commit/3aee2b7))
* **Transition:** expose the current `UiRouter` object as a public property ([52f1308](https://github.com/angular-ui/ui-router/commit/52f1308))
* **Transition:** expose the transition rejection reason as `Transition.error()` ([7a9e383](https://github.com/angular-ui/ui-router/commit/7a9e383)), closes [#2866](https://github.com/angular-ui/ui-router/issues/2866)
* **Transition:** Expose the transition's TargetState as targetState() ([f06f6b6](https://github.com/angular-ui/ui-router/commit/f06f6b6))
* **urlRouter:** Allow a rule to be deleted. ([55f3d3d](https://github.com/angular-ui/ui-router/commit/55f3d3d))

#### ng2
* **ng2.rx:** Added RxJS Observables for transitions and states: ([2a2f381](https://github.com/angular-ui/ui-router/commit/2a2f381))
* **ng2:** Add [@UIRouterModule](https://github.com/UIRouterModule) decorator ([e7bedc2](https://github.com/angular-ui/ui-router/commit/e7bedc2)), closes [#2922](https://github.com/angular-ui/ui-router/issues/2922)
* **ng2:** Improve ng2 bootstrap flexibility with provideUIRouter() provider factory function ([bc17066](https://github.com/angular-ui/ui-router/commit/bc17066)), closes [#2958](https://github.com/angular-ui/ui-router/issues/2958)
* **ng2.UrlRouter:** Implement { location: replace } ([b8c6146](https://github.com/angular-ui/ui-router/commit/b8c6146)), closes [#2850](https://github.com/angular-ui/ui-router/issues/2850)
* **ng2.NgModule:** Add module's states to DI using UIROUTER_STATES_TOKEN ([0cb628e](https://github.com/angular-ui/ui-router/commit/0cb628e))
* **ng2.stateRegistry:** Automatically register states defined on a UIRouterModule ([58a3c84](https://github.com/angular-ui/ui-router/commit/58a3c84))
* **ng2.UIView:** Use merged NgModule/ParentComp to inject routed component ([37241e7](https://github.com/angular-ui/ui-router/commit/37241e7))
* **ng2.upgrade:** Enable ng1-to-ng2 ([0bf4eb4](https://github.com/angular-ui/ui-router/commit/0bf4eb4))
* **uiView:** Support Components loaded via AppModule ([696148f](https://github.com/angular-ui/ui-router/commit/696148f))


### Bug Fixes

#### Core

* **defaultErrorHandler:** Invoke handler when a transition is Canceled. ([4fcccd8](https://github.com/angular-ui/ui-router/commit/4fcccd8)), closes [#2924](https://github.com/angular-ui/ui-router/issues/2924)
* **defaultErrorHandler:** log Error and Error.stack by default ([e102a85](https://github.com/angular-ui/ui-router/commit/e102a85))
* **defaultErrorHandler:** Reduce console.error noise when redirected ([8c0344f](https://github.com/angular-ui/ui-router/commit/8c0344f))
* **common:** Add concrete import to interface.ts to fix unit tests ([2d16740](https://github.com/angular-ui/ui-router/commit/2d16740))
* **redirect:** fix bug where redirected transitions with reload: true got wrong resolve values copied ([bd0e3a3](https://github.com/angular-ui/ui-router/commit/bd0e3a3))
* **redirectTo:** fix redirectTo definition (interface) ([eff7195](https://github.com/angular-ui/ui-router/commit/eff7195)), closes [#2871](https://github.com/angular-ui/ui-router/issues/2871)
* **Rejection:** Silence "Error: Uncaught (in Exception)" ([38432f4](https://github.com/angular-ui/ui-router/commit/38432f4)), closes [#2676](https://github.com/angular-ui/ui-router/issues/2676)
* **Resolve:** prevent RXWAIT from waiting for the observable to complete ([a02caf3](https://github.com/angular-ui/ui-router/commit/a02caf3))
* **ResolvePolicy:** Fix resolve policy config loading ([4440811](https://github.com/angular-ui/ui-router/commit/4440811)), closes [#2945](https://github.com/angular-ui/ui-router/issues/2945)
* **stateService:** change reloadState parameter in reload function is optional ([#2973](https://github.com/angular-ui/ui-router/issues/2973)) ([839dc4a](https://github.com/angular-ui/ui-router/commit/839dc4a))
* **StateService:** remove jQuery deprecated feature ([fa40acc](https://github.com/angular-ui/ui-router/commit/fa40acc))
* **trace:** make TRANSITION trace less noisy when a transition is redirected ([a65c58f](https://github.com/angular-ui/ui-router/commit/a65c58f))
* **Trace:** Fix error in console after $trace.enable() ([013c77a](https://github.com/angular-ui/ui-router/commit/013c77a)), closes [#2752](https://github.com/angular-ui/ui-router/issues/2752)
* **transitionHook:** Prevent queued hookFn to be called if deregistered ([#2939](https://github.com/angular-ui/ui-router/issues/2939)) ([39e1ba7](https://github.com/angular-ui/ui-router/commit/39e1ba7)), closes [#2928](https://github.com/angular-ui/ui-router/issues/2928)
* **typescript:** Make UI-Router `noImplicitAny` safe. ([0769bc2](https://github.com/angular-ui/ui-router/commit/0769bc2)), closes [#2693](https://github.com/angular-ui/ui-router/issues/2693)
* **typescript:** Remove angular1 specific types from ui-router-core methods ([30124bd](https://github.com/angular-ui/ui-router/commit/30124bd)), closes [#2693](https://github.com/angular-ui/ui-router/issues/2693)


#### ng1

* **ng1.stateService:** Coerce 'null' `params` value to empty object ([f674151](https://github.com/angular-ui/ui-router/commit/f674151)), closes [#2952](https://github.com/angular-ui/ui-router/issues/2952)
* **ng1.uiSref:** Allow nested UISrefs by stopping event propagation on-click ([b4a2499](https://github.com/angular-ui/ui-router/commit/b4a2499)), closes [#2962](https://github.com/angular-ui/ui-router/issues/2962)
* **ng1.uiSrefActive:** update sref-active after existing transition-in-progress completes ([0994c71](https://github.com/angular-ui/ui-router/commit/0994c71)), closes [#2908](https://github.com/angular-ui/ui-router/issues/2908)
* **uiSref, uiState:** added click unbind to prevent memory leaks ([79d501e](https://github.com/angular-ui/ui-router/commit/79d501e))
* **uiView:** separate $uiView and $uiViewAnim element.data() ([a94117d](https://github.com/angular-ui/ui-router/commit/a94117d)), closes [#2763](https://github.com/angular-ui/ui-router/issues/2763)

#### ng2

* **ng2.pushState:** Properly match urls when base path set ([b9be2dc](https://github.com/angular-ui/ui-router/commit/b9be2dc)), closes [#2745](https://github.com/angular-ui/ui-router/issues/2745)
* **ng2.UIRouterConfig:** Allow new UIRouter() to finish before configuring it ([a151f71](https://github.com/angular-ui/ui-router/commit/a151f71))
* **ng2.uiSrefActive:** Allow uiSrefActive on ancestor element. ([874fc07](https://github.com/angular-ui/ui-router/commit/874fc07)), closes [#2950](https://github.com/angular-ui/ui-router/issues/2950)
* **ng2.uiSrefActive:** don't puke on sref to invalid target state ([c9b6570](https://github.com/angular-ui/ui-router/commit/c9b6570))
* **ng2.UISrefActive:** Use [@ContentChildren](https://github.com/ContentChildren) to query for the nested UISref ([999c42a](https://github.com/angular-ui/ui-router/commit/999c42a)), closes [#2950](https://github.com/angular-ui/ui-router/issues/2950)
* **ng2.UiView:** fix input resolve binding ([4f53f81](https://github.com/angular-ui/ui-router/commit/4f53f81))
* **ng2.UIView:** Make routed to component appear *inside* UIView, not next to it. ([558fc80](https://github.com/angular-ui/ui-router/commit/558fc80))


<a name="1.0.0-beta.1"></a>
# [1.0.0-beta.1](https://github.com/angular-ui/ui-router/compare/1.0.0-alpha.5...v1.0.0-beta.1) (2016-06-30)

# UI-Router 1.0 is in beta

## UI-Router has a new home!

https://ui-router.github.io/new-ui-router-site/


# BREAKING CHANGES

These breaking changes are for users upgrading from a previous alpha, not from 0.x legacy series.
This list is extensive, but typical users won't be affected by most of these changes.

The most common breaks will be #1 and #2

1) BC-BREAK: renamed all Ui* (lowercase 'i') symbols to UI* (uppercase 'I') for more consistent naming.
   - UiView -> UIView
   - UiSref -> UISref (and related directives)
   - UiInjector -> UIInjector

2) BC-BREAK: Transition Hooks are no longer injected (onBefore/onStart/onExit/onRetain/onEnter/onFinish/onSuccess/onError)

   Previously, a hook like `['$state', ($state) => $state.target('foo')]` would get `$state` injected.
   Now, all hooks receive two parameters:
   - transition: the current Transition, which has an `injector()` function
   - state: for onEnter/onRetain/onExit hooks only, the State which the hook is being run for. This value will be null for onBefore/onStart/onFinish/onSuccess/onError hooks.

   Refactor your hooks
   from: `['$state', 'mySvc', ($state, mySvc) => mySvc.foo() ? $state.target('foo')] : true`
   to: `(trans) => trans.injector().get('mySvc').foo() ? trans.router.stateService.target('foo') : true`

   Note: for backwards compatiblity, angular 1 onEnter/onExit/onRetain hooks are still injected

3) BC-BREAK: - The (internal API) State object's .resolve property is now an array of Resolvables, built from your state definitions by the StateBuilder

4) BC-BREAK: - Removed the default resolve called `$resolve$`, which was added in a previous alpha

5) BC-BREAK: - `Transition.addResolves()`  replaced with `Transition.addResolvable()`

6) BC-BREAK: remove `ResolveContext.getResolvables()` in favor of `.getToken()`` and `.getResolvable()`

7) BC-BREAK: remove `ResolveContext.invokeLater()` and `.invokeNow()`

8) BC-BREAK: remove support for `JIT` resolves.  This also eliminated the need for the `loadAllControllerLocals` hook which was also removed

9) BC-BREAK: Replaced `ViewConfig.node` with `ViewConfig.path`. Angular 1's `$(element).data('$uiView')` is affected. 
   Previously the .node was the node for the view. Now the last element in the path is the node for the view.

10) BC-BREAK: Nodes no longer have (stateful) `.resolveContext` properties. Instead, a new ResolveContext is wrapped over a Path of Nodes.  Removed `PathFactory.bindResolveContexts()`.

11) BC-BREAK: ResolveContext.resolvePath returns a promise for resolved data as an array of tuples, instead of a promise for an object of resolved data.  Removed `ResolveContext.resolvePathElement()`.

12) BC-BREAK: Removed ResolvePolicy enum in favor of the ResolvePolicy interface `{ when: "", async: "" }`

13) BC-BREAK: renamed `ResolveContext.isolateRootTo` to `subContext`

14) BC-BREAK: rename `UIRouterGlobals` class to `Globals`; add `UIRouterGlobals` back as an interface

15) BC-BREAK: Moved `defaultErrorHandler` from `TransitionService` to `StateService`




### Features

* **Resolve:** Switch state.resolve to be an array of Resolvables ([6743a60](https://github.com/angular-ui/ui-router/commit/6743a60))
* **Resolve:** support ng2-like provide object literals.  Support injection of arbitrary tokens, not just strings. ([a7e5ea6](https://github.com/angular-ui/ui-router/commit/a7e5ea6))
* **Resolve:** support ng2-like provide object literals ([a7e5ea6](https://github.com/angular-ui/ui-router/commit/a7e5ea6))
* **Transition:** expose the current `UiRouter` object as a public property ([52f1308](https://github.com/angular-ui/ui-router/commit/52f1308))
* **redirectTo:** Process `redirectTo` property of a state as a redirect string/object/hook function ([6becb12](https://github.com/angular-ui/ui-router/commit/6becb12)), closes [#27](https://github.com/angular-ui/ui-router/issues/27) [#948](https://github.com/angular-ui/ui-router/issues/948)
* **rejectFactory:** separate transition aborted and transition errored reject types ([55995fd](https://github.com/angular-ui/ui-router/commit/55995fd))
* **ParamType:** allow a custom parameter Type to specify a default value for a parameter's `dynamic` property
* **Resolvable:** Added a new Resolve Policy 'RXWAIT'.  If an Observable is returned, pass the observable as the value, but also wait for it to emit its first value

### Bug Fixes

* **ng2.pushState:** Properly match urls when base path set ([b9be2dc](https://github.com/angular-ui/ui-router/commit/b9be2dc)), closes [#2745](https://github.com/angular-ui/ui-router/issues/2745)
* **ng2.UIRouterConfig:** Allow new UIRouter() to finish before configuring it ([a151f71](https://github.com/angular-ui/ui-router/commit/a151f71))
* **ng2.UiView:** fix input resolve binding ([4f53f81](https://github.com/angular-ui/ui-router/commit/4f53f81))
* **ng2.UIView:** Make routed to component appear *inside* UIView, not next to it. ([558fc80](https://github.com/angular-ui/ui-router/commit/558fc80))
* **redirect:** fix bug where redirected transitions with reload: true got wrong resolve values copied ([bd0e3a3](https://github.com/angular-ui/ui-router/commit/bd0e3a3))
* **Rejection:** Silence "Error: Uncaught (in Exception)" ([38432f4](https://github.com/angular-ui/ui-router/commit/38432f4)), closes [#2676](https://github.com/angular-ui/ui-router/issues/2676)
* **Trace:** Fix error in console after $trace.enable() ([013c77a](https://github.com/angular-ui/ui-router/commit/013c77a)), closes [#2752](https://github.com/angular-ui/ui-router/issues/2752)
* **ng2.UIView:** Trigger change detection once for routed components




<a name="1.0.0-alpha.5"></a>
# [1.0.0-alpha.5](https://github.com/angular-ui/ui-router/compare/1.0.0-alpha.3...v1.0.0-alpha.5) (2016-05-13)


### Bug Fixes

## Core
* **attachRoute:** Do not update URL after syncing from url([8742511](https://github.com/angular-ui/ui-router/commit/8742511)), closes [#2730](https://github.com/angular-ui/ui-router/issues/2730)
* **common:** only use window if available([32ff988](https://github.com/angular-ui/ui-router/commit/32ff988))
* **coreservices:** Use Promise.reject()/resolve()/all()([62b2ebc](https://github.com/angular-ui/ui-router/commit/62b2ebc)), closes [#2683](https://github.com/angular-ui/ui-router/issues/2683)
* **paramTypes.hash:** Update hash for each transition([79d4fd7](https://github.com/angular-ui/ui-router/commit/79d4fd7)), closes [#2742](https://github.com/angular-ui/ui-router/issues/2742)
* **Rejection:** Dont log an ignored trans as console.error([7522c26](https://github.com/angular-ui/ui-router/commit/7522c26)), closes [#2676](https://github.com/angular-ui/ui-router/issues/2676)
* **resolve:** Fix regression; Allow resolve values to be service names([a34fd3b](https://github.com/angular-ui/ui-router/commit/a34fd3b)), closes [#2588](https://github.com/angular-ui/ui-router/issues/2588)
* **StateQueueManager:** Do not throw on orphan states.([95ae0cf](https://github.com/angular-ui/ui-router/commit/95ae0cf)), closes [#2546](https://github.com/angular-ui/ui-router/issues/2546)
* **TransitionManager:** Update url even when the Transition is ignored.([f9c3e3c](https://github.com/angular-ui/ui-router/commit/f9c3e3c)), closes [#2723](https://github.com/angular-ui/ui-router/issues/2723)

## ng1
* **ng1.component:** Allow route-to-component "@" and optional bindings([71b3393](https://github.com/angular-ui/ui-router/commit/71b3393)), closes [#2708](https://github.com/angular-ui/ui-router/issues/2708)
* **view:** only run ng1 route-to-component code if component: is a string([ec1c534](https://github.com/angular-ui/ui-router/commit/ec1c534))

## ng2
* **ng2.uiSrefStatus:** Avoid "dehydrated detector" error([9111727](https://github.com/angular-ui/ui-router/commit/9111727)), closes [#2684](https://github.com/angular-ui/ui-router/issues/2684)
* **ng2.uiView:** Fix "Invalid left-hand in assignment"([3f711a1](https://github.com/angular-ui/ui-router/commit/3f711a1))
* **build:** declare external dep on `angular/core` in webpack bundle([adfbde3](https://github.com/angular-ui/ui-router/commit/adfbde3)), closes [#2687](https://github.com/angular-ui/ui-router/issues/2687)



### Features

## ng2
* **ng2.uiView:** bind resolve data to input[] and [@Input](https://github.com/Input)(), process bindings:([f6dae28](https://github.com/angular-ui/ui-router/commit/f6dae28))
* **ng2.urlRouter:** HTML5 PushState support([9842fb7](https://github.com/angular-ui/ui-router/commit/9842fb7)), closes [#2688](https://github.com/angular-ui/ui-router/issues/2688)
* **ng2.UIRouter:** update to ng2 beta.17([45c0758](https://github.com/angular-ui/ui-router/commit/45c0758))
* **ng2.UIRouter:** Update ui-router for ng2 rc.1([3219406](https://github.com/angular-ui/ui-router/commit/3219406)), closes [#2722](https://github.com/angular-ui/ui-router/issues/2722)



<a name="1.0.0-alpha.4"></a>
# [1.0.0-alpha.4](https://github.com/angular-ui/ui-router/compare/1.0.0-alpha.3...v1.0.0-alpha.4) (2016-04-06)

### Bug Fixes

* **ng2.uiView:** Fix "Invalid left-hand in assignment" ([3f711a1](https://github.com/angular-ui/ui-router/commit/3f711a1))
* **view:** only run ng1 route-to-component code if component: is a string ([ec1c534](https://github.com/angular-ui/ui-router/commit/ec1c534))

### Features

* **uiView:** add support for hybrid ng1/ng2 ui-router apps via ng-upgrade and http://github.com/ui-router/ng1-to-ng2
* **ng2.uiView:** bind resolve data to input[] and @Input(), process bindings: ([f6dae28](https://github.com/angular-ui/ui-router/commit/f6dae28))



<a name="1.0.0-alpha.2"></a>
# [1.0.0-alpha.2](https://github.com/angular-ui/ui-router/compare/1.0.0-alpha.1...v1.0.0-alpha.2) (2016-04-03)

Changes between 1.0.0-alpha.1 and 1.0.0-alpha.2

## Angular 2
This is the first release with angular 2 support.  See http://github.com/ui-router/quickstart-ng2 for a small ui-router-ng2 app

### Bug Fixes

* **ViewHooks:** Avoid calling $onInit if angular 1.5 will call it for us ([d42b617](https://github.com/angular-ui/ui-router/commit/d42b617)), closes [#2660](https://github.com/angular-ui/ui-router/issues/2660)
* **ViewHooks:** Fix problem with injecting uiCanExit ([76ab22d](https://github.com/angular-ui/ui-router/commit/76ab22d)), closes [#2661](https://github.com/angular-ui/ui-router/issues/2661)
* **view:** temporary sanity check that a node exists ([1c0edeb](https://github.com/angular-ui/ui-router/commit/1c0edeb)), closes [#2657](https://github.com/angular-ui/ui-router/issues/2657)
* **justjs.$q:** Fix $q.all([..]) and $q.all({...}) ([b1624c6](https://github.com/angular-ui/ui-router/commit/b1624c6))
* **ng2.uiSref:** Fix anchor href generation ([98b5b42](https://github.com/angular-ui/ui-router/commit/98b5b42))
* **ng2.uiSrefStatus:** calculate target state parameters ([46cdf4c](https://github.com/angular-ui/ui-router/commit/46cdf4c))
* **ng2.uiView:** Dispose prev comp on empty viewconfig ([f28e0c3](https://github.com/angular-ui/ui-router/commit/f28e0c3))

### Features

* **UIRouterConfig:** Define UIRouterConfig class for router bootstrap ([c16b9e6](https://github.com/angular-ui/ui-router/commit/c16b9e6))
* **UIRouterGlobals:** Create UIRouterGlobals ([0eb7406](https://github.com/angular-ui/ui-router/commit/0eb7406)), closes [#2525](https://github.com/angular-ui/ui-router/issues/2525)
* **ui-router-ng2:** Update providers and viewsBuilder to match new 1.0 API ([ff54d61](https://github.com/angular-ui/ui-router/commit/ff54d61))
* **ng2.uiSrefActive:** Implement uiSrefStatus, uiSrefActive, uiSrefActiveEq ([fcb15c5](https://github.com/angular-ui/ui-router/commit/fcb15c5))



<a name="1.0.0-alpha.1"></a>
# [1.0.0-alpha.1](https://github.com/angular-ui/ui-router/compare/1.0.0alpha0...v1.0.0-alpha.1) (2016-03-27)

## We will maintain a list of [Known BC from 0.2.x to 1.0 final](https://github.com/angular-ui/ui-router/issues/2219) to help people upgrade to the 1.0 release.

## Bug fixes and features since 1.0.0alpha0

### Bug Fixes

* **date:** Compare dates only using year, month, date ([7a68ade](https://github.com/angular-ui/ui-router/commit/7a68ade)), closes [#2484](https://github.com/angular-ui/ui-router/issues/2484)
* **params:** Clone all properties of a Node. Introduce applyRawParams() ([88c624d](https://github.com/angular-ui/ui-router/commit/88c624d))
* **RejectFactory:** stringify rejections with circular dependency-aware stringify ([199db79](https://github.com/angular-ui/ui-router/commit/199db79)), closes [#2538](https://github.com/angular-ui/ui-router/issues/2538)
* **src/resolve:** use injector's strictDi value in calls to .annotate ([4c5b5d8](https://github.com/angular-ui/ui-router/commit/4c5b5d8))
* **stateQueueManager:** Use `location: true` for url-matched transitions ([25e0c04](https://github.com/angular-ui/ui-router/commit/25e0c04)), closes [#2455](https://github.com/angular-ui/ui-router/issues/2455)
* **stateService:** Process reload: in the StateService.target() ([081da32](https://github.com/angular-ui/ui-router/commit/081da32)), closes [#2537](https://github.com/angular-ui/ui-router/issues/2537)
* **Transition:** Do not reuse resolves for reloaded state during redirect ([0c123c3](https://github.com/angular-ui/ui-router/commit/0c123c3)), closes [#2539](https://github.com/angular-ui/ui-router/issues/2539)
* **Transition:** Reject Transition promise when onBefore error ([4b6d56f](https://github.com/angular-ui/ui-router/commit/4b6d56f)), closes [#2561](https://github.com/angular-ui/ui-router/issues/2561)
* **Transition:** Reset URL to current state after aborted transition ([3a1308b](https://github.com/angular-ui/ui-router/commit/3a1308b)), closes [#2611](https://github.com/angular-ui/ui-router/issues/2611)
* **transition/transitionService:** uses console.error to log error in default error handler ([43a8fc5](https://github.com/angular-ui/ui-router/commit/43a8fc5))
* **ui-sref:** update ui-sref-active/eq info when params change ([dcbaebf](https://github.com/angular-ui/ui-router/commit/dcbaebf)), closes [#2554](https://github.com/angular-ui/ui-router/issues/2554)
* **ui-state:** update ui-sref-active/eq info ([025ebc8](https://github.com/angular-ui/ui-router/commit/025ebc8)), closes [#2488](https://github.com/angular-ui/ui-router/issues/2488)
* **UrlMatcher:** Format parent/child UrlMatchers properly ([86e07ef](https://github.com/angular-ui/ui-router/commit/86e07ef)), closes [##2504](https://github.com/#/issues/2504)
* **UrlMatcher:** isOptional always false for empty parameter ([4e85db4](https://github.com/angular-ui/ui-router/commit/4e85db4))

### Features

* **params:** Add uiOnParamsChanged controller callback ([961c96d](https://github.com/angular-ui/ui-router/commit/961c96d)), closes [#2608](https://github.com/angular-ui/ui-router/issues/2608) [#2470](https://github.com/angular-ui/ui-router/issues/2470) [#2391](https://github.com/angular-ui/ui-router/issues/2391) [#1967](https://github.com/angular-ui/ui-router/issues/1967)
* **resolve:** Allow all resolved data for a node to be injected as `$resolve$` ([e432c27](https://github.com/angular-ui/ui-router/commit/e432c27))
* **state:** Expose the internal state API via `$$state()` ([92053f1](https://github.com/angular-ui/ui-router/commit/92053f1)), closes [#13](https://github.com/angular-ui/ui-router/issues/13)
* **ui-router-ng2:** Initial angular2 support ([217de70](https://github.com/angular-ui/ui-router/commit/217de70))
* **uiCanExit:** Add controller lifecycle hook "uiCanExit" ([afcfe95](https://github.com/angular-ui/ui-router/commit/afcfe95))
* **uiView:** Expose the resolved data for a state as $scope.$resolve ([0f6aea6](https://github.com/angular-ui/ui-router/commit/0f6aea6)), closes [#2175](https://github.com/angular-ui/ui-router/issues/2175) [#2547](https://github.com/angular-ui/ui-router/issues/2547)
* **uiView:** Fire the $onInit hook ([c8afc38](https://github.com/angular-ui/ui-router/commit/c8afc38)), closes [#2559](https://github.com/angular-ui/ui-router/issues/2559)
* **uiView:** Put $animate promises on element.data('$uiView') ([a5578de](https://github.com/angular-ui/ui-router/commit/a5578de)), closes [#2562](https://github.com/angular-ui/ui-router/issues/2562) [#2579](https://github.com/angular-ui/ui-router/issues/2579)
* **view:** Route a view to a directive using `component:` ([1552032](https://github.com/angular-ui/ui-router/commit/1552032)), closes [#2627](https://github.com/angular-ui/ui-router/issues/2627)



## Other commits

Many of these commits are merged from 0.2.x `legacy` branch

* **uiSrefActive:** allow multiple classes ([120d7ad](https://github.com/angular-ui/ui-router/commit/120d7ad)), closes [#2481](https://github.com/angular-ui/ui-router/issues/2481) [#2482](https://github.com/angular-ui/ui-router/issues/2482)
* **justjs:** provide naive implementation of most of the coreservices api ([426f134](https://github.com/angular-ui/ui-router/commit/426f134))
* **resolve:** add $resolve service back to 1.0 ([70c6659](https://github.com/angular-ui/ui-router/commit/70c6659))
* **uiSrefActive:** allow active & active-eq on same element ([d9a676b](https://github.com/angular-ui/ui-router/commit/d9a676b)), closes [#1997](https://github.com/angular-ui/ui-router/issues/1997)
* **uiSrefActive:** provide a ng-{class,style} like interface ([a9ff6fe](https://github.com/angular-ui/ui-router/commit/a9ff6fe)), closes [#1431](https://github.com/angular-ui/ui-router/issues/1431)
* **uiSrefActive:** Added support for multiple nested uiSref directives ([b184494](https://github.com/angular-ui/ui-router/commit/b184494))
* **uiState:** add ui-state directive ([3831af1](https://github.com/angular-ui/ui-router/commit/3831af1)), closes [#395](https://github.com/angular-ui/ui-router/issues/395) [#900](https://github.com/angular-ui/ui-router/issues/900) [#1932](https://github.com/angular-ui/ui-router/issues/1932)
* **urlMatcher:** add support for optional spaces ([4b7f304](https://github.com/angular-ui/ui-router/commit/4b7f304))
* **urlMatcher:** Add param only type names ([6a371f9](https://github.com/angular-ui/ui-router/commit/6a371f9))
* **$IncludedByStateFilter:** add parameters to $IncludedByStateFilter ([963f6e7](https://github.com/angular-ui/ui-router/commit/963f6e7)), closes [#1735](https://github.com/angular-ui/ui-router/issues/1735)
* **$state:** make state data inheritance prototypical ([c4fec8c](https://github.com/angular-ui/ui-router/commit/c4fec8c))
* **$state:** Inject templateProvider with resolved values ([afa20f2](https://github.com/angular-ui/ui-router/commit/afa20f2))
* **$state:** added 'state' to state reload method (feat no.1612) ([b8f0457](https://github.com/angular-ui/ui-router/commit/b8f0457))
* **$state:** broadcast $stateChangeCancel event when event.preventDefault() is called in $sta ([ecefb75](https://github.com/angular-ui/ui-router/commit/ecefb75))
* **$state:** inject resolve params into controllerProvider ([b380c22](https://github.com/angular-ui/ui-router/commit/b380c22)), closes [#1131](https://github.com/angular-ui/ui-router/issues/1131)
* **$state:** support URLs with #fragments ([3da0a17](https://github.com/angular-ui/ui-router/commit/3da0a17))
* **$uiViewScroll:** change function to return promise ([c2a9a31](https://github.com/angular-ui/ui-router/commit/c2a9a31)), closes [#1702](https://github.com/angular-ui/ui-router/issues/1702)



<a name="0.2.18"></a>
### 0.2.18 (2016-02-07)

This is a maintenance release which fixes a few known bugs introduced in 0.2.16.

#### Bug Fixes

* **$urlRouter:** revert BC: resolve clashing of routes This reverts commit b5c57c8ec2e14e17e75104 ([2f1ebefc](https://github.com/angular-ui/ui-router/commit/2f1ebefc242ff48960e0bf63da359296a38f6852), closes [#2501](https://github.com/angular-ui/ui-router/issues/2501))
* **uiState:** Corrected typo for 'ref' variable (#2488, #2508) ([b8f3c144](https://github.com/angular-ui/ui-router/commit/b8f3c144b913e620f177b78f3b4f52afa61d41a6))
* **$urlMatcherFactory:** Fix to make the YUI Javascript compressor work ([ad9c41d2](https://github.com/angular-ui/ui-router/commit/ad9c41d2e723d50e30dd3452fbd274b7057dc3d9))
* **stateBuilder:** fix non-url params on a state without a url. The parameters are now applied when ([d6d8c332](https://github.com/angular-ui/ui-router/commit/d6d8c3322c4dde8bb5b8dde25f9fcda49e9c4c81), closes [#2025](https://github.com/angular-ui/ui-router/issues/2025))
* **ui-view:** (ui-view) use static renderer when no animation is present for a ui-view ([2523bbdb](https://github.com/angular-ui/ui-router/commit/2523bbdb5542483a489c22804f1751b8b9f71703), closes [#2485](https://github.com/angular-ui/ui-router/issues/2485)). This allows a ui-view scope to be destroyed when switching states, before the next view is initialized.


#### Features

* **ui-view:** Add noanimation attribute to specify static renderer. ([2523bbdb](https://github.com/angular-ui/ui-router/commit/2523bbdb5542483a489c22804f1751b8b9f71703), closes [#2485](https://github.com/angular-ui/ui-router/issues/2485)). This allows a ui-view scope to be destroyed before the next ui-view is initialized, when ui-view animation is not present.


<a name="0.2.17"></a>
### 0.2.17 (2016-01-25)


#### Bug Fixes

* **uiSrefActive:** allow multiple classes ([a89114a0](https://github.com/angular-ui/ui-router/commit/a89114a083813c1a7280c48fc18e626caa5a31f4), closes [#2481](https://github.com/angular-ui/ui-router/issues/2481), [#2482](https://github.com/angular-ui/ui-router/issues/2482))


<a name="0.2.16"></a>
### 0.2.16 (2016-01-24)


#### Bug Fixes

* **$state:** 
  * statechangeCancel: Avoid infinite digest in .otherwise/redirect case. Don't clobber url if a new transition has started.  Closes #222 ([e00aa695](https://github.com/angular-ui/ui-router/commit/e00aa695e41ddc5ebd5d2b226aa0917a751b11aa), closes [#2238](https://github.com/angular-ui/ui-router/issues/2238))
  * transitionTo: Allow hash (#) value to be read as toParams['#'] in events.  Re-add the saved hash before broadcasting $stateChangeStart event.  ([8c1bf30d](https://github.com/angular-ui/ui-router/commit/8c1bf30d2a3b78ba40b330f12d854c885d6cc117))
* **$stateParams:** Fix for testing: reset service instance between tests ([2aeb0c4b](https://github.com/angular-ui/ui-router/commit/2aeb0c4b205baf6cfa2ef25bb986bb160dc13bf9))
* **$urlRouter:** 
  * Sort URL rules by specificity. Potential minor BC if apps were relying on rule registration order.  ([b5c57c8e](https://github.com/angular-ui/ui-router/commit/b5c57c8ec2e14e17e75104c1424654f126ea4011))
  * Use $sniffer for pushstate compat check ([c219e801](https://github.com/angular-ui/ui-router/commit/c219e801797f340ef9c5c919ab890ef003a7a042))
* **UrlMatcher:**
  * Properly encode/decode slashes in parameters Closes #2172 Closes #2250 Closes #1 ([02e98660](https://github.com/angular-ui/ui-router/commit/02e98660a80dfd1ca4b113dd24ee304af91e9f8c), closes [#2339](https://github.com/angular-ui/ui-router/issues/2339))
  * Array types:  Fix default value for array query parameters.  Pass empty arrays through in handler. ([20d6e243](https://github.com/angular-ui/ui-router/commit/20d6e243f1745ddbf257217245a1dc22eabe13da), closes [#2222](https://github.com/angular-ui/ui-router/issues/2222))
  * Remove trailing slash, if parameter is optional and was squashed from URL ([77fa11bf](https://github.com/angular-ui/ui-router/commit/77fa11bf0787d0f6da97ab0003ab29afb7411391), closes [#1902](https://github.com/angular-ui/ui-router/issues/1902))
  * Allow a parameter declaration to configure the parameter type by name. closes #2294 ([e4010249](https://github.com/angular-ui/ui-router/commit/e40102492d40fe1cf6ba14d955fcc9f345c16458))
  * include the slash when recognizing squashed params in url ([b5130bb1](https://github.com/angular-ui/ui-router/commit/b5130bb1215e15f832ea6daa670410b9a950c0d4), closes [#2064](https://github.com/angular-ui/ui-router/issues/2064))
  * Allow url query param names to contain periods ([d31b3337](https://github.com/angular-ui/ui-router/commit/d31b3337cc2ce71d87c92fdded629e46558d0b49))
* **reloadOnSearch:** Update `locals.globals.$stateParams` when reloadOnSearch=false ([350d3e87](https://github.com/angular-ui/ui-router/commit/350d3e87783a2263fd7d23913da34f1268c3300b), closes [#2356](https://github.com/angular-ui/ui-router/issues/2356))
* **ui-view:** 
  * fix $animate usage for ng 1.4+ ([9b6d9a2d](https://github.com/angular-ui/ui-router/commit/9b6d9a2d0ce4ae08384165cb517bddea59b67892))
  * change $viewContentLoading to pair with $viewContentLoaded ([f9b43d66](https://github.com/angular-ui/ui-router/commit/f9b43d66833f0e17de41fd8d1cc3b491e3ba4a0e), closes [#685](https://github.com/angular-ui/ui-router/issues/685))
  * $destroy event is triggered before animation ends ([1be13795](https://github.com/angular-ui/ui-router/commit/1be13795686ab78abb2d5094bc8addcacb928975))
* **uiSref:** 
  * Ensure URL once param checks pass ([9dc31c54](https://github.com/angular-ui/ui-router/commit/9dc31c5465328e5666468b0c2319ce205f4b72f8), closes [#2091](https://github.com/angular-ui/ui-router/issues/2091))
  * uiSrefActive: update the active classes after linking directive ([7c914030](https://github.com/angular-ui/ui-router/commit/7c914030f13e05e45a941c1b723cb785db729890))


#### Features

* **$IncludedByStateFilter:** add parameters to $IncludedByStateFilter ([963f6e71](https://github.com/angular-ui/ui-router/commit/963f6e71633b9c3a266f3991d79089b7d14786b4), closes [#1735](https://github.com/angular-ui/ui-router/issues/1735))
* **isStateFilter:** Include optional state params. ([71d74699](https://github.com/angular-ui/ui-router/commit/71d7469987ee9ca86a41c8c6393ccd5d8913c3d6))
* **$state:** make state data inheritance prototypical ([c4fec8c7](https://github.com/angular-ui/ui-router/commit/c4fec8c7998113902af4152d716c42dada6eb465))
* **$stateChangeStart:** Add options to event ([a1f07559](https://github.com/angular-ui/ui-router/commit/a1f07559ec74e10ff80bc4be81f287e3772b8fcb))
* **UrlMatcher:** Add param only type names ([6a371f9b](https://github.com/angular-ui/ui-router/commit/6a371f9b70e37a82eb324122879e4473c3f6d526))
* **uiSrefActive:**
  * provide a ng-{class,style} like interface ([a9ff6feb](https://github.com/angular-ui/ui-router/commit/a9ff6febb469e0d5cd49054216c4472df7a6259d))
  * allow active & active-eq on same element ([d9a676ba](https://github.com/angular-ui/ui-router/commit/d9a676ba2c4d9e954be224c60496bcb38f6074e3))
* **uiState:** add ui-state directive ([3831af1d](https://github.com/angular-ui/ui-router/commit/3831af1dc71b601351e6694af0665a77297f8f7f), closes [#395](https://github.com/angular-ui/ui-router/issues/395), [#900](https://github.com/angular-ui/ui-router/issues/900), [#1932](https://github.com/angular-ui/ui-router/issues/1932))
* **urlMatcher:** add support for optional spaces in params ([4b7f3046](https://github.com/angular-ui/ui-router/commit/4b7f304617f0b3590b532103b5c2fb526c98a9e4))


<a name="0.2.15"></a>
### 0.2.15 (2015-05-19)


#### Bug Fixes

* **$state:** reloadOnSearch should not affect non-search param changes. ([6ca0d770](https://github.com/angular-ui/ui-router/commit/6ca0d7704cf7de9c6e6b7bb64df2f9c68fe081cc), closes [#1079](https://github.com/angular-ui/ui-router/issues/1079))
* **urlMatcherFactory:** Revert to 0.2.13 behavior where all string parameters are considered optional fi ([495a02c3](https://github.com/angular-ui/ui-router/commit/495a02c3cbde501c1c149bce137806669209bc29), closes [#1963](https://github.com/angular-ui/ui-router/issues/1963))
* **urlRouter:** allow .when() to redirect, even after a successful $state.go() - This partially  ([48aeaff6](https://github.com/angular-ui/ui-router/commit/48aeaff645baf3f42f5a8940ebd97563791ad9f8), closes [#1584](https://github.com/angular-ui/ui-router/issues/1584))


#### Features

* **$state:** Inject templateProvider with resolved values ([afa20f22](https://github.com/angular-ui/ui-router/commit/afa20f22373b7176b26daa7e1099750c4254a354))


<a name="0.2.14"></a>
### 0.2.14 (2015-04-23)


#### Bug Fixes

* **$StateRefDirective:** resolve missing support for svg anchor elements #1667 ([0149a7bb](https://github.com/angular-ui/ui-router/commit/0149a7bb38b7af99388a1ad7cc9909a7b7c4439d))
* **$urlMatcherFactory:**
  * regex params should respect case-sensitivity ([1e10519f](https://github.com/angular-ui/ui-router/commit/1e10519f3be6bbf0cefdcce623cd2ade06e649e5), closes [#1671](https://github.com/angular-ui/ui-router/issues/1671))
  * unquote all dashes from array params ([06664d33](https://github.com/angular-ui/ui-router/commit/06664d330f882390655dcfa83e10276110d0d0fa))
  * add Type.$normalize function ([b0c6aa23](https://github.com/angular-ui/ui-router/commit/b0c6aa2350fdd3ce8483144774adc12f5a72b7e9))
  * make optional params regex grouping optional ([06f73794](https://github.com/angular-ui/ui-router/commit/06f737945e83e668d09cfc3bcffd04a500ff1963), closes [#1576](https://github.com/angular-ui/ui-router/issues/1576))
* **$state:** allow about.*.** glob patterns ([e39b27a2](https://github.com/angular-ui/ui-router/commit/e39b27a2cb7d88525c446a041f9fbf1553202010))
* **uiSref:**
  * use Object's toString instead of Window's toString ([2aa7f4d1](https://github.com/angular-ui/ui-router/commit/2aa7f4d139dbd5b9fcc4afdcf2ab6642c87f5671))
  * add absolute to allowed transition options ([ae1b3c4e](https://github.com/angular-ui/ui-router/commit/ae1b3c4eedc37983400d830895afb50457c63af4))
* **uiSrefActive:** Apply active classes on lazy loaded states ([f0ddbe7b](https://github.com/angular-ui/ui-router/commit/f0ddbe7b4a91daf279c3b7d0cee732bb1f3be5b4))
* **uiView:** add `$element` to locals for view controller ([db68914c](https://github.com/angular-ui/ui-router/commit/db68914cd6c821e7dec8155bd33142a3a97f5453))


#### Features

* **$state:**
  * support URLs with #fragments ([3da0a170](https://github.com/angular-ui/ui-router/commit/3da0a17069e27598c0f9d9164e104dd5ce05cdc6))
  * inject resolve params into controllerProvider ([b380c223](https://github.com/angular-ui/ui-router/commit/b380c223fe12e2fde7582c0d6b1ed7b15a23579b), closes [#1131](https://github.com/angular-ui/ui-router/issues/1131))
  * added 'state' to state reload method (feat no.1612)  - modiefied options.reload  ([b8f04575](https://github.com/angular-ui/ui-router/commit/b8f04575a8557035c1858c4d5c8dbde3e1855aaa))
  * broadcast $stateChangeCancel event when event.preventDefault() is called in $sta ([ecefb758](https://github.com/angular-ui/ui-router/commit/ecefb758cb445e41620b62a272aafa3638613d7a))
* **$uiViewScroll:** change function to return promise ([c2a9a311](https://github.com/angular-ui/ui-router/commit/c2a9a311388bb212e5a2e820536d1d739f829ccd), closes [#1702](https://github.com/angular-ui/ui-router/issues/1702))
* **uiSrefActive:** Added support for multiple nested uiSref directives ([b1844948](https://github.com/angular-ui/ui-router/commit/b18449481d152b50705abfce2493a444eb059fa5))


<a name="0.2.13"></a>
### 0.2.13 (2014-11-20)

This release primarily fixes issues reported against 0.2.12

#### Bug Fixes

* **$state:** fix $state.includes/.is to apply param types before comparisions fix(uiSref): ma ([19715d15](https://github.com/angular-ui/ui-router/commit/19715d15e3cbfff724519e9febedd05b49c75baa), closes [#1513](https://github.com/angular-ui/ui-router/issues/1513))
  * Avoid re-synchronizing from url after .transitionTo ([b267ecd3](https://github.com/angular-ui/ui-router/commit/b267ecd348e5c415233573ef95ebdbd051875f52), closes [#1573](https://github.com/angular-ui/ui-router/issues/1573))
* **$urlMatcherFactory:**
  * Built-in date type uses local time zone ([d726bedc](https://github.com/angular-ui/ui-router/commit/d726bedcbb5f70a5660addf43fd52ec730790293))
  * make date type fn check .is before running ([aa94ce3b](https://github.com/angular-ui/ui-router/commit/aa94ce3b86632ad05301530a2213099da73a3dc0), closes [#1564](https://github.com/angular-ui/ui-router/issues/1564))
  * early binding of array handler bypasses type resolution ([ada4bc27](https://github.com/angular-ui/ui-router/commit/ada4bc27df5eff3ba3ab0de94a09bd91b0f7a28c))
  * add 'any' Type for non-encoding non-url params ([3bfd75ab](https://github.com/angular-ui/ui-router/commit/3bfd75ab445ee2f1dd55275465059ed116b10b27), closes [#1562](https://github.com/angular-ui/ui-router/issues/1562))
  * fix encoding slashes in params ([0c983a08](https://github.com/angular-ui/ui-router/commit/0c983a08e2947f999683571477debd73038e95cf), closes [#1119](https://github.com/angular-ui/ui-router/issues/1119))
  * fix mixed path/query params ordering problem ([a479fbd0](https://github.com/angular-ui/ui-router/commit/a479fbd0b8eb393a94320973e5b9a62d83912ee2), closes [#1543](https://github.com/angular-ui/ui-router/issues/1543))
* **ArrayType:**
  * specify empty array mapping corner case ([74aa6091](https://github.com/angular-ui/ui-router/commit/74aa60917e996b0b4e27bbb4eb88c3c03832021d), closes [#1511](https://github.com/angular-ui/ui-router/issues/1511))
  * fix .equals for array types ([5e6783b7](https://github.com/angular-ui/ui-router/commit/5e6783b77af9a90ddff154f990b43dbb17eeda6e), closes [#1538](https://github.com/angular-ui/ui-router/issues/1538))
* **Param:** fix default value shorthand declaration ([831d812a](https://github.com/angular-ui/ui-router/commit/831d812a524524c71f0ee1c9afaf0487a5a66230), closes [#1554](https://github.com/angular-ui/ui-router/issues/1554))
* **common:** fixed the _.filter clone to not create sparse arrays ([750f5cf5](https://github.com/angular-ui/ui-router/commit/750f5cf5fd91f9ada96f39e50d39aceb2caf22b6), closes [#1563](https://github.com/angular-ui/ui-router/issues/1563))
* **ie8:** fix calls to indexOf and filter ([dcb31b84](https://github.com/angular-ui/ui-router/commit/dcb31b843391b3e61dee4de13f368c109541813e), closes [#1556](https://github.com/angular-ui/ui-router/issues/1556))


#### Features

* add json parameter Type ([027f1fcf](https://github.com/angular-ui/ui-router/commit/027f1fcf9c0916cea651e88981345da6f9ff214a))


<a name="0.2.12"></a>
### 0.2.12 (2014-11-13)

#### Bug Fixes

* **$resolve:** use resolve fn result, not parent resolved value of same name ([67f5e00c](https://github.com/angular-ui/ui-router/commit/67f5e00cc9aa006ce3fe6cde9dff261c28eab70a), closes [#1317], [#1353])
* **$state:**
  * populate default params in .transitionTo. ([3f60fbe6](https://github.com/angular-ui/ui-router/commit/3f60fbe6d65ebeca8d97952c05aa1d269f1b7ba1), closes [#1396])
  * reload() now reinvokes controllers ([73443420](https://github.com/angular-ui/ui-router/commit/7344342018847902594dc1fc62d30a5c30f01763), closes [#582])
  * do not emit $viewContentLoading if notify: false ([74255feb](https://github.com/angular-ui/ui-router/commit/74255febdf48ae082a02ca1e735165f2c369a463), closes [#1387](https://github.com/angular-ui/ui-router/issues/1387))
  * register states at config-time ([4533fe36](https://github.com/angular-ui/ui-router/commit/4533fe36e0ab2f0143edd854a4145deaa013915a))
  * handle parent.name when parent is obj ([4533fe36](https://github.com/angular-ui/ui-router/commit/4533fe36e0ab2f0143edd854a4145deaa013915a))
* **$urlMatcherFactory:**
  * register types at config ([4533fe36](https://github.com/angular-ui/ui-router/commit/4533fe36e0ab2f0143edd854a4145deaa013915a), closes [#1476])
  * made path params default value "" for backwards compat ([8f998e71](https://github.com/angular-ui/ui-router/commit/8f998e71e43a0b31293331c981f5db0f0097b8ba))
  * Pre-replace certain param values for better mapping ([6374a3e2](https://github.com/angular-ui/ui-router/commit/6374a3e29ab932014a7c77d2e1ab884cc841a2e3))
  * fixed ParamSet.$$keys() ordering ([9136fecb](https://github.com/angular-ui/ui-router/commit/9136fecbc2bfd4fda748a9914f0225a46c933860))
  * empty string policy now respected in Param.value() ([db12c85c](https://github.com/angular-ui/ui-router/commit/db12c85c16f2d105415f9bbbdeb11863f64728e0))
  * "string" type now encodes/decodes slashes ([3045e415](https://github.com/angular-ui/ui-router/commit/3045e41577a8b8b8afc6039f42adddf5f3c061ec), closes [#1119])
  * allow arrays in both path and query params ([fdd2f2c1](https://github.com/angular-ui/ui-router/commit/fdd2f2c191c4a67c874fdb9ec9a34f8dde9ad180), closes [#1073], [#1045], [#1486], [#1394])
  * typed params in search ([8d4cab69](https://github.com/angular-ui/ui-router/commit/8d4cab69dd67058e1a716892cc37b7d80a57037f), closes [#1488](https://github.com/angular-ui/ui-router/issues/1488))
  * no longer generate unroutable urls ([cb9fd9d8](https://github.com/angular-ui/ui-router/commit/cb9fd9d8943cb26c7223f6990db29c82ae8740f8), closes [#1487](https://github.com/angular-ui/ui-router/issues/1487))
  * handle optional parameter followed by required parameter in url format. ([efc72106](https://github.com/angular-ui/ui-router/commit/efc72106ddcc4774b48ea176a505ef9e95193b41))
  * default to parameter string coersion. ([13a468a7](https://github.com/angular-ui/ui-router/commit/13a468a7d54c2fb0751b94c0c1841d580b71e6dc), closes [#1414](https://github.com/angular-ui/ui-router/issues/1414))
  * concat respects strictMode/caseInsensitive ([dd72e103](https://github.com/angular-ui/ui-router/commit/dd72e103edb342d9cf802816fe127e1bbd68fd5f), closes [#1395])
* **ui-sref:**
  * Allow sref state options to take a scope object ([b5f7b596](https://github.com/angular-ui/ui-router/commit/b5f7b59692ce4933e2d63eb5df3f50a4ba68ccc0))
  * replace raw href modification with attrs. ([08c96782](https://github.com/angular-ui/ui-router/commit/08c96782faf881b0c7ab00afc233ee6729548fa0))
  * nagivate to state when url is "" fix($state.href): generate href for state with  ([656b5aab](https://github.com/angular-ui/ui-router/commit/656b5aab906e5749db9b5a080c6a83b95f50fd91), closes [#1363](https://github.com/angular-ui/ui-router/issues/1363))
  * Check that state is defined in isMatch() ([92aebc75](https://github.com/angular-ui/ui-router/commit/92aebc7520f88babdc6e266536086e07263514c3), closes [#1314](https://github.com/angular-ui/ui-router/issues/1314), [#1332](https://github.com/angular-ui/ui-router/issues/1332))
* **uiView:**
  * allow inteprolated ui-view names ([81f6a19a](https://github.com/angular-ui/ui-router/commit/81f6a19a432dac9198fd33243855bfd3b4fea8c0), closes [#1324](https://github.com/angular-ui/ui-router/issues/1324))
  * Made anim work with angular 1.3 ([c3bb7ad9](https://github.com/angular-ui/ui-router/commit/c3bb7ad903da1e1f3c91019cfd255be8489ff4ef), closes [#1367](https://github.com/angular-ui/ui-router/issues/1367), [#1345](https://github.com/angular-ui/ui-router/issues/1345))
* **urlRouter:** html5Mode accepts an object from angular v1.3.0-rc.3 ([7fea1e9d](https://github.com/angular-ui/ui-router/commit/7fea1e9d0d8c6e09cc6c895ecb93d4221e9adf48))
* **stateFilters:** mark state filters as stateful. ([a00b353e](https://github.com/angular-ui/ui-router/commit/a00b353e3036f64a81245c4e7898646ba218f833), closes [#1479])
* **ui-router:** re-add IE8 compatibility for map/filter/keys ([8ce69d9f](https://github.com/angular-ui/ui-router/commit/8ce69d9f7c886888ab53eca7e53536f36b428aae), closes [#1518], [#1383])
* **package:** point 'main' to a valid filename ([ac903350](https://github.com/angular-ui/ui-router/commit/ac9033501debb63364539d91fbf3a0cba4579f8e))
* **travis:** make CI build faster ([0531de05](https://github.com/angular-ui/ui-router/commit/0531de052e414a8d839fbb4e7635e923e94865b3))


#### Features

##### Default and Typed params

This release includes a lot of bug fixes around default/optional and typed parameters.  As such, 0.2.12 is the first release where we recommend those features be used.

* **$state:**
  * add state params validation ([b1379e6a](https://github.com/angular-ui/ui-router/commit/b1379e6a4d38f7ed7436e05873932d7c279af578), closes [#1433](https://github.com/angular-ui/ui-router/issues/1433))
  * is/includes/get work on relative stateOrName ([232e94b3](https://github.com/angular-ui/ui-router/commit/232e94b3c2ca2c764bb9510046e4b61690c87852))
  * .reload() returns state transition promise ([639e0565](https://github.com/angular-ui/ui-router/commit/639e0565dece9d5544cc93b3eee6e11c99bd7373))
* **$templateFactory:** request templateURL as text/html ([ccd60769](https://github.com/angular-ui/ui-router/commit/ccd6076904a4b801d77b47f6e2de4c06ce9962f8), closes [#1287])
* **$urlMatcherFactory:** Made a Params and ParamSet class ([0cc1e6cc](https://github.com/angular-ui/ui-router/commit/0cc1e6cc461a4640618e2bb594566551c54834e2))



<a name="0.2.11"></a>
### 0.2.11 (2014-08-26)


#### Bug Fixes

* **$resolve:** Resolves only inherit from immediate parent fixes #702 ([df34e20c](https://github.com/angular-ui/ui-router/commit/df34e20c576299e7a3c8bd4ebc68d42341c0ace9))
* **$state:**
  * change $state.href default options.inherit to true ([deea695f](https://github.com/angular-ui/ui-router/commit/deea695f5cacc55de351ab985144fd233c02a769))
  * sanity-check state lookups ([456fd5ae](https://github.com/angular-ui/ui-router/commit/456fd5aec9ea507518927bfabd62b4afad4cf714), closes [#980](https://github.com/angular-ui/ui-router/issues/980))
  * didn't comply to inherit parameter ([09836781](https://github.com/angular-ui/ui-router/commit/09836781f126c1c485b06551eb9cfd4fa0f45c35))
  * allow view content loading broadcast ([7b78edee](https://github.com/angular-ui/ui-router/commit/7b78edeeb52a74abf4d3f00f79534033d5a08d1a))
* **$urlMatcherFactory:**
  * detect injected functions ([91f75ae6](https://github.com/angular-ui/ui-router/commit/91f75ae66c4d129f6f69e53bd547594e9661f5d5))
  * syntax ([1ebed370](https://github.com/angular-ui/ui-router/commit/1ebed37069bae8614d41541d56521f5c45f703f3))
* **UrlMatcher:**
  * query param function defaults ([f9c20530](https://github.com/angular-ui/ui-router/commit/f9c205304f10d8a4ebe7efe9025e642016479a51))
  * don't decode default values ([63607bdb](https://github.com/angular-ui/ui-router/commit/63607bdbbcb432d3fb37856a1cb3da0cd496804e))
* **travis:** update Node version to fix build ([d6b95ef2](https://github.com/angular-ui/ui-router/commit/d6b95ef23d9dacb4eba08897f5190a0bcddb3a48))
* **uiSref:**
  * Generate an href for states with a blank url. closes #1293 ([691745b1](https://github.com/angular-ui/ui-router/commit/691745b12fa05d3700dd28f0c8d25f8a105074ad))
  * should inherit params by default ([b973dad1](https://github.com/angular-ui/ui-router/commit/b973dad155ad09a7975e1476bd096f7b2c758eeb))
  * cancel transition if preventDefault() has been called ([2e6d9167](https://github.com/angular-ui/ui-router/commit/2e6d9167d3afbfbca6427e53e012f94fb5fb8022))
* **uiView:** Fixed infinite loop when is called .go() from a controller. ([e13988b8](https://github.com/angular-ui/ui-router/commit/e13988b8cd6231d75c78876ee9d012cc87f4a8d9), closes [#1194](https://github.com/angular-ui/ui-router/issues/1194))
* **docs:**
  * Fixed link to milestones ([6c0ae500](https://github.com/angular-ui/ui-router/commit/6c0ae500cc238ea9fc95adcc15415c55fc9e1f33))
  * fix bug in decorator example ([4bd00af5](https://github.com/angular-ui/ui-router/commit/4bd00af50b8b88a49d1545a76290731cb8e0feb1))
  * Removed an incorrect semi-colon ([af97cef8](https://github.com/angular-ui/ui-router/commit/af97cef8b967f2e32177e539ef41450dca131a7d))
  * Explain return value of rule as function ([5e887890](https://github.com/angular-ui/ui-router/commit/5e8878900a6ffe59a81aed531a3925e34a297377))


#### Features

* **$state:**
  * allow parameters to pass unharmed ([8939d057](https://github.com/angular-ui/ui-router/commit/8939d0572ab1316e458ef016317ecff53131a822))
    * **BREAKING CHANGE**: state parameters are no longer automatically coerced to strings, and unspecified parameter values are now set to undefined rather than null.
  * allow prevent syncUrl on failure ([753060b9](https://github.com/angular-ui/ui-router/commit/753060b910d5d2da600a6fa0757976e401c33172))
* **typescript:** Add typescript definitions for component builds ([521ceb3f](https://github.com/angular-ui/ui-router/commit/521ceb3fd7850646422f411921e21ce5e7d82e0f))
* **uiSref:** extend syntax for ui-sref ([71cad3d6](https://github.com/angular-ui/ui-router/commit/71cad3d636508b5a9fe004775ad1f1adc0c80c3e))
* **uiSrefActive:** 
  * Also activate for child states. ([bf163ad6](https://github.com/angular-ui/ui-router/commit/bf163ad6ce176ce28792696c8302d7cdf5c05a01), closes [#818](https://github.com/angular-ui/ui-router/issues/818))
    * **BREAKING CHANGE** Since ui-sref-active now activates even when child states are active you may need to swap out your ui-sref-active with ui-sref-active-eq, thought typically we think devs want the auto inheritance.

  * uiSrefActiveEq: new directive with old ui-sref-active behavior
* **$urlRouter:**
  * defer URL change interception ([c72d8ce1](https://github.com/angular-ui/ui-router/commit/c72d8ce11916d0ac22c81b409c9e61d7048554d7))
  * force URLs to have valid params ([d48505cd](https://github.com/angular-ui/ui-router/commit/d48505cd328d83e39d5706e085ba319715f999a6))
  * abstract $location handling ([08b4636b](https://github.com/angular-ui/ui-router/commit/08b4636b294611f08db35f00641eb5211686fb50))
* **$urlMatcherFactory:**
  * fail on bad parameters ([d8f124c1](https://github.com/angular-ui/ui-router/commit/d8f124c10d00c7e5dde88c602d966db261aea221))
  * date type support ([b7f074ff](https://github.com/angular-ui/ui-router/commit/b7f074ff65ca150a3cdbda4d5ad6cb17107300eb))
  * implement type support ([450b1f0e](https://github.com/angular-ui/ui-router/commit/450b1f0e8e03c738174ff967f688b9a6373290f4))
* **UrlMatcher:**
  * handle query string arrays ([9cf764ef](https://github.com/angular-ui/ui-router/commit/9cf764efab45fa9309368688d535ddf6e96d6449), closes [#373](https://github.com/angular-ui/ui-router/issues/373))
  * injectable functions as defaults ([00966ecd](https://github.com/angular-ui/ui-router/commit/00966ecd91fb745846039160cab707bfca8b3bec))
  * default values & type decoding for query params ([a472b301](https://github.com/angular-ui/ui-router/commit/a472b301389fbe84d1c1fa9f24852b492a569d11))
  * allow shorthand definitions ([5b724304](https://github.com/angular-ui/ui-router/commit/5b7243049793505e44b6608ea09878c37c95b1f5))
  * validates whole interface ([32b27db1](https://github.com/angular-ui/ui-router/commit/32b27db173722e9194ef1d5c0ea7d93f25a98d11))
  * implement non-strict matching ([a3e21366](https://github.com/angular-ui/ui-router/commit/a3e21366bee0475c9795a1ec76f70eec41c5b4e3))
  * add per-param config support ([07b3029f](https://github.com/angular-ui/ui-router/commit/07b3029f4d409cf955780113df92e36401b47580))
    * **BREAKING CHANGE**: the `params` option in state configurations must now be an object keyed by parameter name.

### 0.2.10 (2014-03-12)


#### Bug Fixes

* **$state:** use $browser.baseHref() when generating urls with .href() ([cbcc8488](https://github.com/angular-ui/ui-router/commit/cbcc84887d6b6d35258adabb97c714cd9c1e272d))
* **bower.json:** JS files should not be ignored ([ccdab193](https://github.com/angular-ui/ui-router/commit/ccdab193315f304eb3be5f5b97c47a926c79263e))
* **dev:** karma:background task is missing, can't run grunt:dev. ([d9f7b898](https://github.com/angular-ui/ui-router/commit/d9f7b898e8e3abb8c846b0faa16a382913d7b22b))
* **sample:** Contacts menu button not staying active when navigating to detail states. Need t ([2fcb8443](https://github.com/angular-ui/ui-router/commit/2fcb84437cb43ade12682a92b764f13cac77dfe7))
* **uiSref:** support mock-clicks/events with no data ([717d3ff7](https://github.com/angular-ui/ui-router/commit/717d3ff7d0ba72d239892dee562b401cdf90e418))
* **uiView:**
  * Do NOT autoscroll when autoscroll attr is missing ([affe5bd7](https://github.com/angular-ui/ui-router/commit/affe5bd785cdc3f02b7a9f64a52e3900386ec3a0), closes [#807](https://github.com/angular-ui/ui-router/issues/807))
  * Refactoring uiView directive to copy ngView logic ([548fab6a](https://github.com/angular-ui/ui-router/commit/548fab6ab9debc9904c5865c8bc68b4fc3271dd0), closes [#857](https://github.com/angular-ui/ui-router/issues/857), [#552](https://github.com/angular-ui/ui-router/issues/552))


#### Features

* **$state:** includes() allows glob patterns for state matching. ([2d5f6b37](https://github.com/angular-ui/ui-router/commit/2d5f6b37191a3135f4a6d9e8f344c54edcdc065b))
* **UrlMatcher:** Add support for case insensitive url matching ([642d5247](https://github.com/angular-ui/ui-router/commit/642d524799f604811e680331002feec7199a1fb5))
* **uiSref:** add support for transition options ([2ed7a728](https://github.com/angular-ui/ui-router/commit/2ed7a728cee6854b38501fbc1df6139d3de5b28a))
* **uiView:** add controllerAs config with function ([1ee7334a](https://github.com/angular-ui/ui-router/commit/1ee7334a73efeccc9b95340e315cdfd59944762d))


### 0.2.9 (2014-01-17)


This release is identical to 0.2.8. 0.2.8 was re-tagged in git to fix a problem with bower.


### 0.2.8 (2014-01-16)


#### Bug Fixes

* **$state:** allow null to be passed as 'params' param ([094dc30e](https://github.com/angular-ui/ui-router/commit/094dc30e883e1bd14e50a475553bafeaade3b178))
* **$state.go:** param inheritance shouldn't inherit from siblings ([aea872e0](https://github.com/angular-ui/ui-router/commit/aea872e0b983cb433436ce5875df10c838fccedb))
* **bower.json:** fixes bower.json ([eed3cc4d](https://github.com/angular-ui/ui-router/commit/eed3cc4d4dfef1d3ef84b9fd063127538ebf59d3))
* **uiSrefActive:** annotate controller injection ([85921422](https://github.com/angular-ui/ui-router/commit/85921422ff7fb0effed358136426d616cce3d583), closes [#671](https://github.com/angular-ui/ui-router/issues/671))
* **uiView:**
  * autoscroll tests pass on 1.2.4 & 1.1.5 ([86eacac0](https://github.com/angular-ui/ui-router/commit/86eacac09ca5e9000bd3b9c7ba6e2cc95d883a3a))
  * don't animate initial load ([83b6634d](https://github.com/angular-ui/ui-router/commit/83b6634d27942ca74766b2b1244a7fc52c5643d9))
  * test pass against 1.0.8 and 1.2.4 ([a402415a](https://github.com/angular-ui/ui-router/commit/a402415a2a28b360c43b9fe8f4f54c540f6c33de))
  * it should autoscroll when expr is missing. ([8bb9e27a](https://github.com/angular-ui/ui-router/commit/8bb9e27a2986725f45daf44c4c9f846385095aff))


#### Features

* **uiSref:** add target attribute behaviour ([c12bf9a5](https://github.com/angular-ui/ui-router/commit/c12bf9a520d30d70294e3d82de7661900f8e394e))
* **uiView:**
  * merge autoscroll expression test. ([b89e0f87](https://github.com/angular-ui/ui-router/commit/b89e0f871d5cc35c10925ede986c10684d5c9252))
  * cache and test autoscroll expression ([ee262282](https://github.com/angular-ui/ui-router/commit/ee2622828c2ce83807f006a459ac4e11406d9258))
