#!env node
"use strict";

const version = require('../package.json').version;
const util = require('@uirouter/publish-scripts/util');
const _exec = util._exec;

util.ensureCleanMaster('master');

// branch, add/commit release files, and push to bower repository
_exec(`git checkout -b bower-${version}`);
_exec(`git add --force release`);
_exec(`git commit -m "bower release ${version}"`);
_exec(`git tag ${version}+bower`);
_exec(`git remote add bower git@github.com:angular-ui/angular-ui-router-bower.git`);
_exec(`git push bower ${version}+bower:${version}`);
_exec(`git remote rm bower`);
_exec(`git checkout master`);
