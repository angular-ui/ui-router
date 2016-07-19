#!/bin/sh
SCRIPTDIR=`dirname $0`;
BASEDIR="$SCRIPTDIR/..";
$BASEDIR/node_modules/typedoc/bin/typedoc $* \
  --experimentalDecorators \
  --readme $BASEDIR/README.md \
  --name "UI-Router" \
  --theme $BASEDIR/typedoctheme \
  --mode modules \
  --module commonjs \
  --target es5 \
  --out $BASEDIR/_doc  \
  $BASEDIR/src $BASEDIR/typings/es6-shim/es6-shim.d.ts $BASEDIR/typings/angularjs/angular.d.ts
