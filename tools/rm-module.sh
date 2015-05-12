#!/bin/bash

set -e

if [[ $# != 1 ]]; then
	echo "Usage: $0 MODULE_NAME"
	exit
fi

cd modules
mv -v $1 /tmp
cd ..

cd public
rm -v $1
cd ..
