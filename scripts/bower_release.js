#!env node
"use strict";
const fs = require('fs');
const path = require('path');
const util = require('@uirouter/publish-scripts/util');
const version = require('../package.json').version;
const _exec = util._exec;

util.packageDir();
const bowerPath = path.resolve(__dirname, '..', 'bower.json');
const bower = JSON.parse(fs.readFileSync(bowerPath));
util.ensureCleanMaster('master');

// update bower.json and push
bower.version = version;
fs.writeFileSync(bowerPath, JSON.stringify(bower, null, 2));
_exec(`git commit -m 'chore(bower): Update bower.json' bower.json`);
_exec(`git push`);

// branch, add/commit release files, and push to bower repository
_exec(`git checkout -b bower-${version}`);
_exec(`git add --force release`);
_exec(`git commit -m "bower release ${version}"`);
_exec(`git tag ${version}+bower`);
_exec(`git remote add bower git@github.com:angular-ui/angular-ui-router-bower.git`);
_exec(`git push bower ${version}+bower:${version}`);
_exec(`git remote rm bower`);
_exec(`git checkout master`);
