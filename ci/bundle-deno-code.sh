#!/bin/bash

# Arguments are passed through: `--dev` keeps console output in the bundle.
deno run -A ./ci/build-deno.js "$@" || exit $?
