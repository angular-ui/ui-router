#!env node
"use strict";

require('shelljs/global');
let _ = require('lodash');
var argv = require('yargs')
    .usage('Usage: $0 <packages> [options]')
    .command('packages', '[optional] Comma separated list of packages to build.')
    .alias('b', 'branch')
    .nargs('b', 1)
    .describe('b', 'Specify non-master branch to release from')
    .help('h')
    .alias('h', 'help')
    .example('$0 --branch feature', 'Release all packages from "feature" branch')
    .argv;

let path = require('path');
let _exec = require('./util')._exec;
let version = require('../package.json').version;
let rootDir = path.resolve(__dirname, '..');
let commands = []; // List of commands that will commit the release

cd(rootDir);

let knownProjects = ['core', 'ng1', 'ng1-bower', 'ng2'];
let projects = knownProjects.slice();

projects.forEach(project => {
    if (knownProjects.indexOf(project) === -1)
        throw new Error(`Unknwon project: ${project}; try: ${knownProjects.join(',')}`);
});

projects = projects.reduce((memo, key) => { memo[key] = true; return memo; }, {});


echo('--> Checking working copy status...');
_exec(`node ${rootDir}/scripts/ensure_clean_master.js ${argv.branch || 'master'}`);

echo('--> Updating CHANGELOG...');
_exec(`node ${rootDir}/scripts/update_changelog.js`);

echo('--> Committing changelog...');
commands.push(``);
commands.push(``);
commands.push(`################# To perform the release ################# `);
commands.push(``);
commands.push(`git commit -m "chore(*): Release prep - Update CHANGELOG" CHANGELOG.md`);
commands.push(`git tag ${version}`);
commands.push(`git push origin ${version}`);


Object.keys(projects).map(project => {
  echo(`Packaging ${project} for npm...`);
  _exec(`node ${rootDir}/scripts/package.js ${project}`);
  var pkgPath = path.resolve(rootDir, "build_packages", project);
  cd(pkgPath);
  
  if (test('-f', './package.json')) {
    commands.push(`echo To publish ${project} to npm:`);
    commands.push(`cd ${pkgPath}`);
    commands.push(`npm publish`);
    commands.push(``);
  }

  if (test('-f', './bower.json')) {
    commands.push(`echo To publish ${project} to bower:`);
    commands.push(`cd ${pkgPath}`);
    commands.push(`node ${rootDir}/scripts/publish_bower.js`);
    commands.push(``);
  }
});
    
commands.forEach(line => echo(line));


