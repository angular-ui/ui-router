#!env node
"use strict";
let conventionalChangelog = require('conventional-changelog');

let options = {
  preset: 'angular'
};

if(require.main === module) {
  let context, gitOpts;

  if (process.argv[2]) {
    context = {};
    gitOpts = {};
    context.previousTag = process.argv[2];
    gitOpts.from = process.argv[2];
  }

  if (process.argv[3]) {
    context.currentTag = process.argv[3];
  }

  showChangelog(context, gitOpts);
}

function showChangelog(context, gitOpts) {
  conventionalChangelog(options, context, gitOpts).pipe(process.stdout);
}
