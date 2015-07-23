#!/bin/bash

set -e

echo -e "Updating \e[33;1myoda-portal\e[0m on branch \e[32;1m`git rev-parse --abbrev-ref HEAD`\e[0m"
echo "- Old version: `git show -s --format='%h - %s'`"
git pull
echo "- New version: `git show -s --format='%h - %s'`"

echo "Updating modules"

tools/update-modules.sh
