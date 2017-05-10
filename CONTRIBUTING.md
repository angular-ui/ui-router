
# Report an Issue

Help us make UI-Router better! If you think you might have found a bug, or some other weirdness, start by making sure
it hasn't already been reported. You can [search through existing issues](https://github.com/angular-ui/ui-router/search?q=wat%3F&type=Issues)
to see if someone's reported one similar to yours.

If not, then [create a plunkr](http://bit.ly/UIR-Plunk) that demonstrates the problem (try to use as little code
as possible: the more minimalist, the faster we can debug it).

Next, [create a new issue](https://github.com/angular-ui/ui-router/issues/new) that briefly explains the problem,
and provides a bit of background as to the circumstances that triggered it. Don't forget to include the link to
that plunkr you created!

**Note**: If you're unsure how a feature is used, or are encountering some unexpected behavior that you aren't sure
is a bug, it's best to talk it out on
[StackOverflow](http://stackoverflow.com/questions/ask?tags=angularjs,angular-ui-router) before reporting it. This
keeps development streamlined, and helps us focus on building great software.


Issues only! |
-------------|
Please keep in mind that the issue tracker is for *issues*. Please do *not* post an issue if you need help or support. Instead, see one of the above-mentioned forums or [IRC](irc://irc.freenode.net/#angularjs). |

#### Purple Labels
A purple label means that **you** need to take some further action.
 - ![Not Actionable - Need Info](https://angular-ui.github.io/ui-router/ngdoc_assets/incomplete.png): Your issue is not specific enough, or there is no clear action that we can take. Please clarify and refine your issue.
 - ![Plunkr Please](https://angular-ui.github.io/ui-router/ngdoc_assets/example.png): Please [create a plunkr](http://bit.ly/UIR-Plunk)
 - ![StackOverflow](https://angular-ui.github.io/ui-router/ngdoc_assets/so.png): We suspect your issue is really a help request, or could be answered by the community.  Please ask your question on [StackOverflow](http://stackoverflow.com/questions/ask?tags=angularjs,angular-ui-router).  If you determine that is an actual issue, please explain why.

If your issue gets labeled with purple label, no further action will be taken until you respond to the label appropriately.

# Contribute

**(1)** See the **[Developing](#developing)** section below, to get the development version of UI-Router up and running on your local machine.

**(2)** Check out the [roadmap](https://github.com/angular-ui/ui-router/milestones) to see where the project is headed, and if your feature idea fits with where we're headed.

**(3)** If you're not sure, [open an RFC](https://github.com/angular-ui/ui-router/issues/new?title=RFC:%20My%20idea) to get some feedback on your idea.

**(4)** Finally, commit some code and open a pull request. Code & commits should abide by the following rules:

- *Always* have test coverage for new features (or regression tests for bug fixes), and *never* break existing tests
- Commits should represent one logical change each; if a feature goes through multiple iterations, squash your commits down to one
- Make sure to follow the [Angular commit message format](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit-message-format) so your change will appear in the changelog of the next release.
- Changes should always respect the coding style of the project



# Developing

UI-Router uses <code>npm</code> and <code>Rollup</code>.

## Fetch the source code

The code for Angular UI-Router is split into two source repositories:

* [UI-Router Core](https://github.com/ui-router/core) (`@uirouter/core` on npm)
* [UI-Router for Angular 1](https://github.com/angular-ui/ui-router) (`@ui-router/angularjs` on npm)

Clone both repositories into directories next to each other.

```
mkdir uirouter
cd uirouter
git clone https://github.com/angular-ui/ui-router.git angularjs
git clone https://github.com/ui-router/core.git core
```

## Install dependencies

Use `npm` to install the development dependencies for each repository.

```
cd core
npm install
cd ../angularjs
npm install
cd ..
```

## Link the directories

This step is necessary if you need to modify any code in `@uirouter/core`.
Using `npm`, link `@uirouter/core` into `@uirouter/angularjs`

```
cd core
npm link
cd ../angularjs
npm link '@uirouter/core'
```

After executing these steps, `@uirouter/angularjs` will be depend on your local copy of `@uirouter/core` instead of the version listed in `package.json`.

## Develop

These scripts may be run in the `angularjs` directory:

* `npm run build`: Compiles TypeScript source
* `npm run package`: Compiles TypeScript source and creates the Rollup bundles.
* `npm test`: Runs the test suite (against Angular 1.2 through 1.5).
* `npm run watch`: Continuously compiles the source and runs the test suite (when either source or tests change).

Scripts of the same name (in the `core` directory) can be used.

* `npm run build`: Compiles `@uirouter/core` TypeScript source
* `npm test`: Runs the `@uirouter/core` test suite
* `npm run watch`: Continuously compiles the source and runs the `@uirouter/core` test suite (when core source or tests change).

If you've followed the [linking instructions](#link-the-directories), it's useful to run both
`npm run watch` tasks (each task from `@uirouter/core` *and* `@uirouter/angularjs`).
This ensures that changes to either `@uirouter/core` and `@uirouter/angularjs` compile successfully and are run against their test suites.
