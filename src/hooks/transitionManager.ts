// /** @module state */ /** for typedoc */
// import {Transition} from "../transition/transition";
// import {Rejection, RejectType} from "../transition/rejectFactory";
//
// import {StateDeclaration} from "../state/interface";
// import {TargetState} from "../state/targetState";
// import {services} from "../common/coreservices";
// import {UiRouter} from "../router";
//
// /** Manages Ignored, Cancelled and Redirected transitions */
// export class TransitionManager {
//   private $q;
//
//   constructor(private transition: Transition, private router: UiRouter) {
//     this.$q = services.$q;
//   }
//
//   runTransition(): Promise<any> {
//     return this.transition.run()
//         .catch(error => this.transRejected(error)); // if rejected, handle dynamic and redirect
//   }
//
//   transRejected(error): (StateDeclaration|Promise<any>) {
//     // Handle redirect and abort
//     if (error instanceof Rejection) {
//       if (error.type === RejectType.IGNORED) {
//         this.router.urlRouter.update();
//         return this.router.globals.current;
//       }
//
//       if (error.type === RejectType.SUPERSEDED && error.redirected && error.detail instanceof TargetState) {
//         let redirectManager = new TransitionManager(this.transition.redirect(error.detail), this.router);
//         return redirectManager.runTransition();
//       }
//
//       if (error.type === RejectType.ABORTED) {
//         this.router.urlRouter.update();
//       }
//     }
//
//     return this.$q.reject(error);
//   }
// }
