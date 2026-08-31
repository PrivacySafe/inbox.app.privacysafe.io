#!/bin/bash

this_dir="$(dirname "${BASH_SOURCE[0]}")"
source "$this_dir/upload-utils.sh"
source "$this_dir/manifest-utils.sh"

channel="$1"

app_domain="$(app_domain_from_manifest manifest.json)"
version="$(version_from_manifest manifest.json)"

pack_file="$(app_pack_name manifest.json).zip"
src_file="$(app_source_name manifest.json).zip"

upload_app_file $app_domain $pack_file $version bin/zip || exit $?

upload_app_file $app_domain $src_file $version src/zip || exit $?

add_app_version_to_channel $app_domain $version $channel || exit $?
