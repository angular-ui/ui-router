#!env node

let package = require('../package.json').name;
let version = require('../package.json').version;

let corePackage = require('../../core/package.json').name;
let coreVersion = require('../../core/package.json').version;

let PAGES_DIR = "../ui-router.github.io";
let sh = require('shelljs');
let readlineSync = require('readline-sync');
let fs = require('fs');
let path = require('path');
let util = require('./util');
let _exec = util._exec;


sh.cd(path.join(__dirname, '..'));
if (!fs.existsSync(PAGES_DIR)) {
  throw new Error("not found: " + PAGES_DIR);
}

if (!readlineSync.keyInYN(`Generate/publish docs from your local copies of ${package}@${version} and ${corePackage}@${coreVersion} ?`)) {
  process.exit(1);
}

_exec('npm run docs');

sh.rm('-rf', PAGES_DIR + '/_ng1_docs/latest');
sh.cp('-r', '_doc', PAGES_DIR + '/_ng1_docs/latest');
sh.cp('-r', '_doc', PAGES_DIR + '/_ng1_docs/' + version);
sh.cd(PAGES_DIR + "/_ng1_docs/");
_exec("./process_docs.sh");
_exec("git add .");

sh.echo("\n\nSpot check the docs, then run these commands to publish:\n\n");
sh.echo("cd " + PAGES_DIR);
sh.echo(`git commit -m 'publish docs for ${version}'`);
sh.echo(`git push`);
