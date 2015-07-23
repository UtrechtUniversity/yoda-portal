#!/bin/bash

set -e

cd modules

for module in *; do
	if [[ -d $module ]]; then
		cd $module
		echo "--------"
		echo -e "Updating module \e[33;1m$module\e[0m on branch \e[32;1m`git rev-parse --abbrev-ref HEAD`\e[0m"
		echo "- Old version: `git show --no-patch --format='%h - %s'`"
		git pull
		echo "- New version: `git show --no-patch --format='%h - %s'`"
		cd ..
	fi
done

cd ..
