#!/bin/sh
set -x
SCRIPTDIR=`dirname $0`;
BASEDIR="$SCRIPTDIR/..";

pushd $BASEDIR;

echo "import './ng1'" > src/docs.ts
echo "import './ng2'" >> src/docs.ts
echo "import './ng1/legacy/stateEvents'" >> src/docs.ts

mv tsconfig.json tsconfig.json.tmp
cp tsconfig.typedoc.json tsconfig.json
typings install --global dt~core-js

$BASEDIR/node_modules/typedoc/bin/typedoc $* \
  --readme $BASEDIR/README.md \
  --name "UI-Router" \
  --theme $BASEDIR/typedoctheme \
  --mode modules \
  --module commonjs \
  --target es5 \
  --out $BASEDIR/_doc 

#$BASEDIR/node_modules/typedoc/bin/typedoc $* \
#  --experimentalDecorators \
#  --readme $BASEDIR/README.md \
#  --name "UI-Router" \
#  --theme $BASEDIR/typedoctheme \
#  --mode modules \
#  --module commonjs \
#  --target es5 \
#  --out $BASEDIR/_doc  \
#  $BASEDIR/src $BASEDIR/typings/index.d.ts

rm -rf $BASEDIR/typings
rm -f src/docs.ts

cp tsconfig.json.tmp tsconfig.json
rm tsconfig.json.tmp

popd
