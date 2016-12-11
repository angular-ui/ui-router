#!/usr/bin/env node

let path = require('path');
let shelljs = require('shelljs');
let replaceInFiles = require('replace-in-file');

let typedocCmd = [
  "./node_modules/typedoc/bin/typedoc --tsconfig tsconfig.typedoc.json ",
  " --readme README.md ",
  " --name 'angular-ui-router' ",
  " --theme node_modules/ui-router-typedoc-themes/bin/default ",
  " --out _doc ",
  " --internal-aliases internal,coreapi,ng1api ",
  " --external-aliases internalapi,external ",
  " --navigation-label-globals angular-ui-router",
].join(" ");

let PROJECTDIR = path.join(__dirname, '..');
// let DOCGENDIR = '_docsgen';
let PROJ2 = 'ui-router-core';

shelljs.pushd(PROJECTDIR);

// shelljs.rm('-rf', DOCGENDIR);
// shelljs.mkdir(DOCGENDIR);

// shelljs.cp('-R', 'src', DOCGENDIR);
// shelljs.mkdir(path.join(DOCGENDIR, PROJ2));
// shelljs.cp('-R', path.join('..', PROJ2, '.git'), path.join(DOCGENDIR, PROJ2, '.git'));
// shelljs.cp('-R', path.join('..', PROJ2, 'src'), path.join(DOCGENDIR, PROJ2, 'src'));

// shelljs.ln('-s', path.join('..', '..', PROJ2), path.join(DOCGENDIR, PROJ2));

shelljs.mv('src', 'src.bak');
shelljs.cp('-r', 'src.bak', 'src');

let arr = [];
for (var i = 0; i < 5; i++) {
  arr.push(arr.length);
  
  let dots = arr.map((val) => '..').join('/');
  let stars = arr.map((val) => '*').join('/');

  replaceInFiles.sync({
    replace: / (['"])ui-router-core\/lib/,
    with: ' $1' + dots + '/ui-router-core/src',
    files: 'src/' + stars + '.ts'
  });

  replaceInFiles.sync({
    replace: / (['"])ui-router-core/,
    with: ' $1' + dots + '/ui-router-core/src',
    files: 'src/' + stars + '.ts'
  });
}

shelljs.exec(typedocCmd);

shelljs.rm('-rf', 'src');
shelljs.mv('src.bak', 'src');
