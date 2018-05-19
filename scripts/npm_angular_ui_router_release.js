#!env node
'use strict';
const fs = require('fs');
const path = require('path');
const util = require('@uirouter/publish-scripts/util');
const version = require('../package.json').version;
const _exec = util._exec;

util.packageDir();
const packagePath = path.resolve(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath));
util.ensureCleanMaster('master');
packageJson.name = 'angular-ui-router';
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

_exec(`npm publish`);
_exec(`git checkout package.json`);
