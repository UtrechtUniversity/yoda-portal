#!/bin/bash

set -e

echo -e "Updating \e[33;1myoda-portal\e[0m on branch \e[32;1m`git rev-parse --abbrev-ref HEAD`\e[0m"
echo "- Old version: `git show -s --format='%h - %s'`"
OLD_SHA=`git show -s --format='%H'`
git pull
echo "- New version: `git show -s --format='%h - %s'`"
NEW_SHA=`git show -s --format='%H'`

# Check if the .htaccess template has changed.
if [[ $(git diff --name-only $OLD_SHA $NEW_SHA -- public/.htaccess.template | wc --lines) -eq "1" ]]; then
	# Manual action is required when the .htaccess template changes.
	echo -e "--------"
	echo -e "\e[1mNOTE:\e[0m It seems that the .htaccess template has changed!"
	echo -e "      Please update your .htaccess by overwriting the currently"
	echo -e "      installed public/.htaccess with public/.htaccess.template,"
	echo -e "      and then uncommenting the applicable CI_ENV line."
	echo
fi

echo "Updating modules"

tools/update-modules.sh
