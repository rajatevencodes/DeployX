#!/bin/bash

# GIT_REPOSITORY_URL will be given as an environment variable (Explained more in README.md)
# export GIT_REPOSITORY_URL = "https://github.com/rajatevencodes/test-vite-deployx.git"
export GIT_REPOSITORY_URL="$USER_GIT_REPOSITORY_URL"

echo "USER_GIT_REPOSITORY_URL: $USER_GIT_REPOSITORY_URL"

git clone "$GIT_REPOSITORY_URL" /home/app/codebase

exec node script.js

