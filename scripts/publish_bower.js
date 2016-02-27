#!env node
"use strict";
require('shelljs/global');
let fs = require('fs');
let _exec = require('./util')._exec;
let assertFile = require('./util').assertFile;
let asJson = require('./util').asJson;

let version = require('../package.json').version;
_exec('pwd')

assertFile('./bower.json');

let bowerJson = JSON.parse(fs.readFileSync('./bower.json', 'UTF-8'));
bowerJson.version = version;
fs.writeFileSync('./bower.json', asJson(bowerJson));

_exec('git init');
_exec('git add .');
_exec('git commit -m  .');
_exec(`git tag ${version}`);
_exec('git remote add bower https://github.com/angular-ui/angular-ui-router-bower.git');
_exec(`git push bower ${version}`);

