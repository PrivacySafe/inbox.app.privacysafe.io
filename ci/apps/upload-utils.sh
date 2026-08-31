
ensure_env_vars_are_set() {
	if [ -z "$UPLOAD_TOKEN" ]
	then
		echo "Variable UPLOAD_TOKEN is not set. Is it present in the project? Is it present for this git branch?"
		return -3
	fi
	if [ -z "$SERVER_CERT" ]
	then
		echo "Variable SERVER_CERT is not set with path to certificate file."
		return -3
	fi
	if [ ! -f "$SERVER_CERT" ]
	then
		echo "File with webhook server's TLS certificate $SERVER_CERT is not found"
		return -3
	fi
}

upload_app_file() {
	ensure_env_vars_are_set || return $?
	local app_domain="$1"
	local file_path="$2"
	if [ ! -e "$file_path" ]
	then
		echo "File $file_path is not found" 1>&2
		return $?
	fi
	local file="$(basename $file_path)"
	local version=$3
	local content=$4
	echo "Uploading $file as
	content: $content
	version: $version"
	local url="https://$SERVER/app/$app_domain/add-file?version=$version&file=$file&content=$content"
	curl --silent --show-error --fail --cacert "$SERVER_CERT" -X POST --header "X-Access-Token: $UPLOAD_TOKEN" --header "Content-Type: application/octet-stream" --data-binary "@$file_path" "$url" || return $?
}


add_app_version_to_channel() {
	ensure_env_vars_are_set || return $?
	local app_domain="$1"
	local version="$2"
	local channel="$3"
	echo "Adding $app_domain version $version to channel $channel"
	local url="https://$SERVER/app/$app_domain/$channel/add?version=$version"
	curl --silent --show-error --fail --cacert "$SERVER_CERT" -X POST --header "X-Access-Token: $UPLOAD_TOKEN" --header "Content-Type: application/octet-stream" --data "{}" "$url" || return $?
}
