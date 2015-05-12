#!/bin/bash

set -e

cd modules

for module in *; do
	if [[ -d $module ]]; then
		echo "Updating module $module"
		cd $module
		git pull
		cd ..
	fi
done

cd ..
