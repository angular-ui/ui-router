#!env node
"use strict";

let pkg = require('../package.json');
let version = pkg.version;
let hybridVersion = require('../../angular-hybrid/package.json').version;

let shx = require('shelljs');
let readlineSync = require('readline-sync');
let fs = require('fs');
let path = require('path');
let util = require('./util');
let _exec = util._exec;

shx.cd(path.join(__dirname, '..'));

var widen = false;
var coreDep = pkg.dependencies['@uirouter/core'];
var isNarrow = /^[[=~]?(\d.*)/.exec(coreDep);
var widenedDep = isNarrow && '^' + isNarrow[1];

if (isNarrow && readlineSync.keyInYN('Widen @uirouter/core dependency from ' + coreDep + ' to ' + widenedDep + '?')) {
  widen = false;
}

let tagname = `${version}-hybrid-${hybridVersion}`;
tagname += readlineSync.question(`Suffix for tag ${tagname} (optional)?`);

if (!readlineSync.keyInYN(`Ready to publish ${tagname} tag?`)) {
  process.exit(1);
}

util.ensureCleanMaster('master');

// then tag and push tag
_exec(`git checkout -b ${tagname}-prep`);

pkg.dependencies['@uirouter/core'] = widenedDep;
pkg.version = tagname;

fs.writeFileSync("package.json", JSON.stringify(pkg, undefined, 2));
_exec('git commit -m "Widening @uirouter/core dependency range to ' + widenedDep + '" package.json');

_exec('npm run package');

_exec(`git add --force lib lib-esm release package.json`);
_exec(`git rm yarn.lock`);

_exec(`git commit -m 'chore(*): commiting build files'`);
_exec(`git tag ${tagname}`);
_exec(`git push -u origin ${tagname}`);
_exec(`git checkout master`);
_exec(`git branch -D ${tagname}-prep`);
