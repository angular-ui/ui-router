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

if (!readlineSync.keyInYN('Did you bump the version number in package.json?')) {
  process.exit(1);
}

if (!readlineSync.keyInYN('Did you update CHANGELOG.md using scripts/update_changelog.js?')) {
  process.exit(1);
}

if (!readlineSync.keyInYN('Did you push all changes back to origin?')) {
  process.exit(1);
}

if (!readlineSync.keyInYN('Ready to publish?')) {
  process.exit(1);
}

util.ensureCleanMaster('master');

_exec('npm run package');
_exec(`npm run docs`);

console.log('Updating version in bower.json to ${version}');

let bowerJson = JSON.parse(fs.readFileSync('bower.json', 'UTF-8'));
bowerJson.version = version;
fs.writeFileSync('bower.json', JSON.stringify(bowerJson));
_exec(`git commit -m "Release ${version}" bower.json`);

util.ensureCleanMaster('master');

// publish to npm first
_exec(`npm publish`);

// then tag and push tag 
_exec(`git tag ${version}`);
_exec(`git push`);
_exec(`git push origin ${version}`);

// branch, add/commit release files, and push to bower repository
_exec(`git checkout -b bower-${version}`);
_exec(`git add --force release`);
_exec(`git commit -m "bower release ${version}"`);
_exec(`git tag ${version}+bower`);
_exec(`git remote add bower https://github.com/angular-ui/angular-ui-router-bower.git`);
_exec(`git push bower ${version}+bower:${version}`);
_exec(`git remote rm bower`);
_exec(`git checkout master`);

console.log("\n\nAPI docs generated (but not deployed) at ./_docs");


