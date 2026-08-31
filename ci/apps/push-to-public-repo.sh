#!/bin/bash

this_dir="$(dirname "${BASH_SOURCE[0]}")"
source "$this_dir/manifest-utils.sh"

pub_site="$1"

if [ -z "$GIT_USER" ] || [ -z "$GIT_EMAIL" ] || [ -z "$GIT_TOKEN" ]
then
	echo "Either git user name, email or access token are not set in environmental variables"
	exit -1
fi

app_manifest_gh_url() {
	echo "https://raw.githubusercontent.com/PrivacySafe/$1/main/manifest.json"
}

app_manifest_cb_url() {
	echo "https://codeberg.org/PrivacySafe/$1/raw/branch/main/manifest.json"
}

dir="$(mktemp -d -t sync-app-repo-XXXXXXXX)"

# unzip app source
src_dir="$dir/src"
mkdir $src_dir || exit $?
for fname in $(ls .)
do
	case "$fname" in
		*-src.zip)
			unzip -q "$fname" -d "$src_dir" || exit $?
			break ;;
		*) ;;
	esac
done

app="$(app_domain_from_manifest $src_dir/manifest.json)"
if [ "$app" == "$APP_DOMAIN" ]
then
	echo "$app 3NWeb app"
else
	echo "App domain from manifest is $app while exected from environment is $APP_DOMAIN and they don't match"
	exit -1
fi

version="$(version_from_manifest $src_dir/manifest.json)"
echo "local version is $version"

if [ "$pub_site" == "github" ]
then
	site_manifest_url="$(app_manifest_gh_url $app)"
	repo_url="https://github.com/PrivacySafe/$app.git"
elif [ "$pub_site" == "codeberg" ]
then
	site_manifest_url="$(app_manifest_cb_url $app)"
	repo_url="https://codeberg.org/PrivacySafe/$app.git"
else
	echo "Unrecognized public site: $pub_site"
	exit -1
fi

repo_version="$(get_from_remote_json "$site_manifest_url" version)"
echo "$pub_site's version is $repo_version"

# compare versions, and exit when no push needed
greater_version="$(node -e "
	const lv = '$version'.split('.').map(s => parseInt(s));
	const rv = '$repo_version'.split('.').map(s => parseInt(s));
	for (let i=0; i<3; i+=1) {
		const l = lv[i];
		const r = rv[i];
		if (isNaN(l) || isNaN(r)) {
			console.log('error');
			console.error('Bad app version: either local $version, or remote $repo_version');
			process.exit();
		}
		if (l > r) {
			console.log('local');
			process.exit();
		} else if (l < r) {
			console.log('remote');
			process.exit();
		}
	}
	console.log('equal');
")"
if [ "$greater_version" == "remote" ] || [ "$greater_version" == "equal" ]
then
	echo "No need to push"
	exit 0
elif [ "$greater_version" != "local" ]
then
	exit -1
fi

# clone repo
repo_dir="$dir/repo"
mkdir $repo_dir
echo "Cloning repository from $repo_url:"
git clone $repo_url $repo_dir || exit $?

# clear repo content and put local one
for entity in $(ls -a  --ignore=. --ignore=.. --ignore=.git $repo_dir)
do
	rm -rf "$repo_dir/$entity" || exit $?
done
mv $src_dir/* $src_dir/.[!.]* $repo_dir/ || exit $?

(cd $repo_dir || exit $?
	git config user.name $GIT_USER || exit $?
	git config user.email $GIT_EMAIL || exit $?
	git config credential.helper '!f() { sleep 1; echo "username=${GIT_USER}"; echo "password=${GIT_TOKEN}"; }; f'
	git add . || exit $?
	git commit --message="v.$version" || exit $?
	git push || exit $?
) || exit $?
