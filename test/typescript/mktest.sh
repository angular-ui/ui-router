#!/usr/bin/env bash

if [[ -z "$1" ]] ; then
  echo "Specify the typescript version, i.e.:4.0";
  echo "$0 4.0";
  exit 1
fi

if [[ -d "$1" ]] ; then
  echo "$1 already exists";
  exit 2
fi

cp -Rp template "$1";
sed -e "s/VERSION/$1/g" < template/package.json > $1/package.json
jq ".typescript += { \"typescript$1\": \"./test/typescript/$1\" }" < ../../downstream_projects.json > temp.json
mv temp.json ../../downstream_projects.json
