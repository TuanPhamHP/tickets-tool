#!/bin/sh
yarn db:push
echo "=== STARTING NODE ==="
node .output/server/index.mjs