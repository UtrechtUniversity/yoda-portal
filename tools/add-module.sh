#!/bin/bash

set -e

if [[ $# != 2 ]]; then
	echo "Usage: $0 GIT_URL MODULE_NAME"
	exit
fi

cd modules
git clone "$1" "$2"
cd ..

cd public
ln -sv ../modules/$2/public $2
cd ..
