#!/usr/bin/env node

let path = require('path');
let shelljs = require('shelljs');
let replaceInFiles = require('replace-in-file');

let typedocCmd = [
  "./node_modules/typedoc/bin/typedoc --tsconfig tsconfig.typedoc.json ",
  " --readme DOCS.md ",
  " --name '@uirouter/angularjs' ",
  " --theme node_modules/ui-router-typedoc-themes/bin/default ",
  " --out _doc ",
  " --internal-aliases internal,coreapi,ng1api ",
  " --external-aliases internalapi,external ",
  " --navigation-label-globals @uirouter/angularjs",
].join(" ");

let PROJECTDIR = path.join(__dirname, '..');

shelljs.pushd(PROJECTDIR);

// Make a backup of the source directory
shelljs.mv('src', 'src.bak');
shelljs.cp('-r', 'src.bak', 'src');

let arr = [];
// This replaces "@uirouter/core" with "../../../core"
// while accounting for how many "../../" should be prepended
for (var i = 0; i < 5; i++) {
  arr.push(arr.length);
  
  let dots = arr.map((val) => '..').join('/');
  let stars = arr.map((val) => '*').join('/');

  // Replace references to "@uirouter/core/lib" with "../core/lib" for typedoc
  replaceInFiles.sync({
    from: / (['"])\@uirouter\/core\/lib/g,
    to: ' $1' + dots + '/../core/src',
    files: 'src/' + stars + '.ts'
  });

  // Replace references to "@uirouter/core" with "../core" for typedoc
  replaceInFiles.sync({
    from: / (['"])\@uirouter\/core/g,
    to: ' $1' + dots + '/../core/src',
    files: 'src/' + stars + '.ts'
  });
}

// Run typedoc
console.log("");
console.log(typedocCmd);
console.log("");
shelljs.exec(typedocCmd);

// Restore original sources
shelljs.rm('-rf', 'src');
shelljs.mv('src.bak', 'src');
