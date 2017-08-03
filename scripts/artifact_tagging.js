#!env node
"use strict";

const CONFIG = require('./artifacts.json');
const COMMIT_ARTIFACTS = CONFIG.ARTIFACTS;

let shx = require('shelljs');
let readlineSync = require('readline-sync');
let fs = require('fs');
let path = require('path');
let util = require('./util');
let _exec = util._exec;

let pkg = require('../package.json');
let version = pkg.version;

shx.cd(path.join(__dirname, '..'));

var widen = false, npm = false, githubtag = false;
var coreDep = pkg.dependencies['@uirouter/core'];
var isNarrow = /^[[=~]?(\d.*)/.exec(coreDep);
var widenedDep = isNarrow && '^' + isNarrow[1];

if (isNarrow && readlineSync.keyInYN('Widen @uirouter/core dependency from ' + coreDep + ' to ' + widenedDep + '?')) {
  widen = false;
}

if (readlineSync.keyInYN('Publish to NPM')) {
  npm = true;
}


if (readlineSync.keyInYN('publish to Github Tag?')) {
  githubtag = true;
}

if (!npm && !githubtag) {
  process.exit(1);
}

var label = githubtag && npm ? "npm package and github tag" : npm ? "npm package" : "github tag";

const YYYYMMDD = (function() {
  var date = new Date();
  var year = date.getFullYear();

  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;

  var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  return year + month + day;
})();

let tagname = `SNAPSHOT-${YYYYMMDD}`;
let pkgver = `-SNAPSHOT.${YYYYMMDD}`;

if (githubtag) {
  tagname += readlineSync.question(`Suffix for tag ${tagname} (optional)?`);
}

if (npm) {
  pkgver += readlineSync.question(`Suffix for package version ${pkgver} (optional)?`);
}

if (!readlineSync.keyInYN(`Ready to publish ${label}?`)) {
  process.exit(1);
}

util.ensureCleanMaster('master');

// then tag and push tag
_exec(`git checkout -b ${tagname}-prep`);

pkg.dependencies['@uirouter/core'] = widenedDep;
pkg.version += pkgver;

fs.writeFileSync("package.json", JSON.stringify(pkg, undefined, 2));
_exec(`git commit -m "Widening @uirouter/core dependency range to ${widenedDep}" package.json`);

_exec(`npm run package`);

if (npm) {
  let output = _exec(`npm dist-tag ls ${pkg.name}`).stdout;
  let latest = output.split(/[\r\n]/)
    .map(line => line.split(": "))
    .filter(linedata => linedata[0] === 'latest')[0];

  if (!latest) {
    throw new Error(`Could not determine value of "latest" dist-tag for ${pkg.name}`);
  }
  
  _exec(`npm publish`);
  _exec(`npm dist-tag add ${pkg.name}@${latest} latest`);
}

if (githubtag) {
  _exec(`git add --force ${COMMIT_ARTIFACTS.join(' ')}`);
  _exec(`git rm yarn.lock`);

  _exec(`git commit -m 'chore(*): commiting build files'`);
  _exec(`git tag ${tagname}`);
  _exec(`git push -u origin ${tagname}`);
}

_exec(`git checkout master`);
_exec(`git branch -D ${tagname}-prep`);

