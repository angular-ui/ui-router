#!env node
"use strict";

require('shelljs/global');
let path = require('path');
let _exec = require('./util')._exec;

cd(path.resolve(__dirname, '..'));

echo('Updating CHANGELOG...');
cp('CHANGELOG.md', 'CHANGELOG.bak');
_exec('node ./scripts/show_changelog.js >> CHANGELOG.new');
_exec('cat CHANGELOG.new CHANGELOG.bak > CHANGELOG.md');
rm('CHANGELOG.bak', 'CHANGELOG.new');
