#!/bin/sh
SCRIPTDIR=`dirname $0`;
BASEDIR="$SCRIPTDIR/..";

pushd $BASEDIR;
typings install --global dt~es6-shim
typings install --global dt~angular
typings install --global dt~jquery
popd

$BASEDIR/node_modules/typedoc/bin/typedoc $* \
  --experimentalDecorators \
  --readme $BASEDIR/README.md \
  --name "UI-Router" \
  --theme $BASEDIR/typedoctheme \
  --mode modules \
  --module commonjs \
  --target es5 \
  --out $BASEDIR/_doc  \
  $BASEDIR/src $BASEDIR/typings/index.d.ts

  rm -rf $BASEDIR/typings
