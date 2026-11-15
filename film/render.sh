#!/bin/sh
# Renders the film, the poster and the review stills. Needs ffmpeg, Google Chrome and Python with Pillow.
set -e
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p out ../assets ../docs/screens

[ -n "$SKIP_RENDER" ] || npx remotion render src/index.ts Film out/film-raw.mp4 --codec=h264 --crf=12 --pixel-format=yuv420p --color-space=bt709 --muted \
  --log=error --browser-executable="$CHROME"

ffmpeg -y -loglevel error -i out/film-raw.mp4 -an -c:v libx264 -preset slow -crf "${CRF:-19}" \
  -pix_fmt yuv420p \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -profile:v high -level 4.0 -movflags +faststart ../assets/film.mp4

# poster: scene 2
ffmpeg -y -loglevel error -i out/film-raw.mp4 -vf "select=eq(n\,170)" -frames:v 1 out/poster.png
python3 -c "from PIL import Image; Image.open('out/poster.png').convert('RGB').save('../assets/film-poster.webp', quality=84, method=6)"

# review stills: one per scene and one transition
i=1
for fr in 50 170 236 332 450 580; do
  ffmpeg -y -loglevel error -i ../assets/film.mp4 -vf "select=eq(n\,$fr),scale=960:-2" -frames:v 1 "../docs/screens/film-0$i.png"
  i=$((i + 1))
done
ls -l ../assets/film.mp4 ../assets/film-poster.webp
