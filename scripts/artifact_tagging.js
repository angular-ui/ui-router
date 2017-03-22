#!env node
"use strict";

let version = require('../package.json').version;

require('shelljs/global');
let readlineSync = require('readline-sync');
let fs = require('fs');
let path = require('path');
let util = require('./util');
let _exec = util._exec;

cd(path.join(__dirname, '..'));

if (!readlineSync.keyInYN('Ready to publish to ' + version + '-artifacts tag?')) {
  process.exit(1);
}

util.ensureCleanMaster('master');

_exec('npm run package');

// then tag and push tag
_exec(`git checkout -b ${version}-artifacts-prep`);
_exec(`git add --force lib lib-esm release`);
_exec(`git commit -m 'chore(*): commiting build files'`);
_exec(`git tag ${version}-artifacts`);
_exec(`git push -u origin ${version}-artifacts`);
_exec(`git checkout -b master`);
_exec(`git branch -D ${version}-artifacts-prep`);
