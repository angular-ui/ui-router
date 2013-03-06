#!/bin/bash -e
if git status --porcelain 2>/dev/null | grep -q .; then
  echo "Working copy is dirty" >&2
  exit 1
fi
rm -rf build
git checkout gh-pages
git merge master
grunt dist
git add build
git commit -m 'automatic gh-pages build'
git checkout master
