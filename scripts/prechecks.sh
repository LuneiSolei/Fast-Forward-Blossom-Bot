#! /bin/bash

set -e

# Ensure COMMENT value is valid
case "${COMMENT}" in
  always|on-error|never) 
    echo "COMMENT=${COMMENT}" >> "${GITHUB_ENV}"
    ;;
  *)
    echo "::error::Invalid value '${COMMENT}' for COMMENT." >&2
    exit 1
    ;;
esac

# Ensure GITHUB_TOKEN is set
if [[ -z "${GITHUB_TOKEN}" ]]
then
  echo "::error::Invalid value '${GITHUB_TOKEN}' for GITHUB_TOKEN." >&2
  exit 1
else
  echo "GITHUB_TOKEN=${GITHUB_TOKEN}" >> "${GITHUB_ENV}"
fi

# Ensure AUTO_MERGE is valid
case "${AUTO_MERGE}" in
  true|false) 
    echo "AUTO_MERGE=${AUTO_MERGE}" >> "${AUTO_MERGE}"
    ;;
  *)
    echo "::error::Invalid value '${AUTO_MERGE}' for AUTO_MERGE." >&2
    exit 1
    ;;
esac

# Ensure we're running via GitHub Actions
if [[ -z "${GITHUB_EVENT_PATH}" ]]
then
  echo "::error::GITHUB_EVENT_PATH environment variable must be set."
  exit 1
fi

echo "::debug::env"
echo "::debug::GITHUB_ENV: ${GITHUB_ENV}"
echo "::debug::${GITHUB_ENV}"
echo "::debug::GITHUB_EVENT_PATH: ${GITHUB_EVENT_PATH}"
echo "::debug::${GITHUB_EVENT_PATH}"
