#!env node
"use strict";

let scriptname = __filename.split('/').reverse()[0];
let fs = require('fs');
let path = require('path');
let glob = require('glob');
require('shelljs/global');
let assertDir = require('./util').assertDir;
let assertFile = require('./util').assertFile;
let asJson = require('./util').asJson;
let _ = require('lodash');

// When run from command line, use the argv[2] as the comma separated list
// of packages to build
let pkgNameArg = process.argv[2];
if (pkgNameArg != null) prepPackage(pkgNameArg);

function prepPackage(pkgName) {
  if (!pkgName) usage();

  let paths = {};
  paths.script = __filename;
  paths.scriptdir = __dirname;
  paths.basedir = path.resolve(paths.scriptdir, '..');
  paths.pkgsrc = path.resolve(paths.basedir, 'packages', pkgName);
  paths.build = path.resolve(paths.basedir, `build_packages/${pkgName}`);

  let files = {};
  files.sources = path.resolve(paths.pkgsrc, "sources.json");
  files.pkgfile = path.resolve(paths.pkgsrc, "package.json");
  files.bowerfile = path.resolve(paths.pkgsrc, "bower.json");
  files.tsconfig = path.resolve(paths.pkgsrc, "tsconfig.json");
  files.webpack = path.resolve(paths.pkgsrc, "webpack.config.js");

  // Check for some paths and files required to build a package
  assertDir(paths.pkgsrc);
  assertFile(files.sources);
  assertFile(files.tsconfig);
  assertFile(files.webpack);

  // Load sources.json which contains some details for the specific package
  let sources = JSON.parse(fs.readFileSync(files.sources, "utf-8"));
  // Subdirectory to copy the source files for building
  paths.srcCopy = path.resolve(paths.build, sources.dirs.src);

  echo(`--> Cleaning: ${paths.build}`);
  rm('-rf', paths.build);
  mkdir('-p', paths.build);

  echo(`--> Packaging: ${pkgName}\nFrom: ${paths.pkgsrc}\nInto: ${paths.build}`);

  // If the package definition contains a package.json, merge it with the package.json in
  // the project root, and write it to the package build dir
  if (test('-f', files.pkgfile)) {
    let packageJsonDest = `${paths.build}/package.json`;
    let basePackageJson = require('../package.json');

    echo(`Merging ${files.pkgfile} with ${paths.basedir}/package.json ...`);
    echo(`... and writing to ${packageJsonDest}`);

    delete basePackageJson.scripts;
    delete basePackageJson.dependencies;
    delete basePackageJson.devDependencies;

    let packageJson = Object.assign({}, basePackageJson, JSON.parse(fs.readFileSync(files.pkgfile, 'utf8')));
    fs.writeFileSync(packageJsonDest, asJson(packageJson));
  }

  // If the package definition contains a bower.json, merge it with specific fields from the package.json in
  // the project root, and write it to the package build dir
  if (test('-f', files.bowerfile)) {
    let bowerJsonDest = `${paths.build}/bower.json`;
    let pkg = require('../package.json');

    echo(`Merging ${files.bowerfile} with ${paths.basedir}/package.json ...`);
    echo(`... and writing to ${bowerJsonDest}`);

    let packageJson = JSON.parse(fs.readFileSync(files.bowerfile, 'utf8'));
    packageJson.version = pkg.version;
    packageJson.homepage = pkg.homepage;
    fs.writeFileSync(bowerJsonDest, asJson(packageJson));
  }

  echo(`Copying typescript sources to ${paths.srcCopy}`);
  cp('-R', `${paths.basedir}/src/`, paths.srcCopy);
  console.log("Excludes: " + sources.excludes);
  let excludes = (sources.excludes || [])
      .map(exclude => glob.sync(exclude, { cwd: paths.srcCopy}))
      .reduce((acc, arr) => acc.concat(arr))
      .map(file => `${paths.srcCopy}/${file}`)
      .forEach(file => rm('-rf', file));

  echo('--> Staging package...');
  // Copy these baseFiles from the root dir
  let baseFiles = ['LICENSE', 'CHANGELOG.md', 'README.md', 'CONTRIBUTING.md'];
  baseFiles.filter(file => test('-f', `${paths.basedir}/${file}`))
      .forEach(file => cp(`${paths.basedir}/${file}`, paths.build));

  // Copy any of these files from the packages dir
  // Override any baseFiles with the copy from the package dir.
  let pkgFiles = ['gitignore', 'npmignore'];
  baseFiles.concat(pkgFiles).filter(file => test('-f', `${paths.pkgsrc}/${file}`))
      .forEach(file => cp(`${paths.pkgsrc}/${file}`, `${paths.build}/.${file}`));

  cp(files.webpack, paths.srcCopy);

  // Merge the root tsconfig.json with the tsconfig property of package.config.js
  // Write the merged tsconfig.json to the copied source files dir
  let baseTsConfigJson = require('../tsconfig.json');
  delete baseTsConfigJson.files;
  let tsconfigJson = _.merge({}, baseTsConfigJson, JSON.parse(fs.readFileSync(files.tsconfig)));
  fs.writeFileSync(path.resolve(paths.srcCopy, 'tsconfig.json'), asJson(tsconfigJson));

  echo('--> Linking node_modules and typings...');
  // In case the source needs typings and node_modules to compile, symlink them
  ln('-sf', `${paths.basedir}/typings`, `${paths.build}/typings`);
  ln('-sf', `${paths.basedir}/node_modules`, `${paths.srcCopy}/node_modules`);

  echo('--> Building webpack bundles...');
  cd(paths.srcCopy);
  exec(`node ./node_modules/webpack/bin/webpack.js`);

  echo('--> Building commonjs and typings using tsc...');
  exec(`node ./node_modules/typescript/bin/tsc`);
  
  echo('<-- done!');
}

function usage() { echo(`Usage:\n  ${scriptname} [core/ng1/ng2/all]`); exit(-100); }

module.exports = prepPackage;
