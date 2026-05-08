#!/bin/bash

set -e

PUSH_LOG=$(mktemp)
if [[ "${HAS_PERMS}" == "true" ]] && [[ "${IS_POSSIBLE}" == "true" ]] && [[ "${AUTO_MERGE}" == "true" ]]
then
  {
    printf "Fast Forwarding \`%s\` (%s) to " "${BASE_REF}" "${BASE_SHA}"
    printf "\`%s\` (%s)." "${HEAD_REF}" "${HEAD_SHA}"
  
    printf "\`\`\`shell\n"
    (
      # Show the git command in the output
      PS4="$ "
      set -x
  
      # Push the commit directly to the base branch.
      # This fast-forwards BASE_REF to point to HEAD_SHA
      git push origin "${HEAD_SHA}:${BASE_REF}"
    )
    printf "\`\`\`\n"
  } 2>&1 | tee -a "${GITHUB_STEP_SUMMARY}" | tee "${PUSH_LOG}"
fi

echo "PUSH_LOG path ${PUSH_LOG}"
echo "PUSH_LOG contents:"
cat ${PUSH_LOG}"

# Write to GitHub output
printf "PUSH_LOG=%s\n" "${PUSH_LOG}" >> "${GITHUB_ENV}"
