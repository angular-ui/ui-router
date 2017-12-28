#!/bin/bash

for NGVER in 1.* ; do
  pushd $NGVER
  for PKG in angular angular-animate angular-mocks ; do
    curl -O -L https://unpkg.com/${PKG}@${NGVER}/$PKG.js
  done
  popd
done
