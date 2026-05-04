#!/usr/bin bash

set -e

# Ensure DEBUG value is valid
case "${DEBUG:-true}" in
    false) DEBUG=0;;
    true) DEBUG=1;;
    *)
        echo "Warning: Invalid value '$DEBUG' for DEBUG. Using default value 'true'." >&2;
        DEBUG=1
        ;;
esac

# Ensure COMMENT value is valid
case "${COMMENT:-always}" in
    never) COMMENT=never;;
    always) COMMENT=always;;
    on-error) COMMENT=on-error;;
    *)
        echo "Warning: Invalid value '$COMMENT' for COMMENT. Using default value 'always'" >&2;
        COMMENT=on-error
        ;;
esac

# Ensure we're running via GitHub Actions
if [ -z "${GITHUB_EVENT_PATH:-}" ]
then
    echo "GITHUB_EVENT_PATH environment variable must be set."
fi

# Do some logging if DEBUG is enabled
if [ "${DEBUG}" -eq 1 ]
then
    {
        echo env
        env
        echo GITHUB_ENV: ${GITHUB_ENV}
        cat ${GITHUB_ENV}
        echo GITHUB_EVENT_PATH: ${GITHUB_EVENT_PATH}
        cat ${GITHUB_EVENT_PATH}
    } >&2
fi
