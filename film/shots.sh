#!/bin/sh
# usage: ./shots.sh 45 170 ...   -> out/stills/f<frame>.png at half size
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p out/stills
for fr in "$@"; do
  npx remotion still src/index.ts Film "out/stills/f$fr.png" --frame="$fr" --scale=0.5 --log=error --browser-executable="$CHROME" || exit 1
done
