#!/bin/sh

cd $(dirname "$0")
cd ..
BINPATH=node_modules/.bin/sass

SOURCE=client/styles/style.scss
TARGET=public/build/style.css

if [ "$1" = "--watch" ]; then
  BINPATH="$BINPATH --watch"
fi

$BINPATH $SOURCE $TARGET
