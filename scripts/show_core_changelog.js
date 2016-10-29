#!env node
"use strict";
var gitSemverTags = require('git-semver-tags');
var shelljs = require('shelljs');
var path = require('path');

shelljs.config.silent = true;
gitSemverTags(function (err, val) {
  var fromTag;
  if(require.main === module) {
    if (process.argv[2]) {
      fromTag = process.argv[2];
    }
  } else {
    var prev = shelljs.exec('git show ' + val[0] + ':package.json', {silent:true}).stdout;
    fromTag = JSON.parse(prev).dependencies['ui-router-core'].replace(/[=~^]/, "");
  }

  var toTag = require("../package.json").dependencies['ui-router-core'].replace(/[=~^]/g, "");
  shelljs.pushd(path.join(__dirname, "../../ui-router-core"));
  // console.log("node " + path.join(__dirname, "../../ui-router-core/scripts/show_changelog.js") + " " + fromTag + " " + toTag)
  shelljs.config.silent = false;
  shelljs.exec("node " + path.join(__dirname, "../../ui-router-core/scripts/show_changelog.js") + " " + fromTag + " " + toTag)
});
