#!/bin/bash
set -e -o pipefail

filter=''
if [ "$1" == '-f' ]; then
  filter="$2"
  if [ "$filter" == '' ]; then
    echo 'Pod name expected.' >&2
    exit 1
  fi
  shift
  shift
fi

pods=$(kubectl get pods)


if [ "$filter" != '' ]; then
  pods=$(echo "$pods" | grep "$filter")
else
  pods=$(echo "$pods" | sed '1d' )
fi

if [ "$pods" != '' ]; then
  pod_list=$(echo "$pods" \
      | awk '{ print $1 }' \
      | tr '\n' ' ')
  kubectl delete pods $pod_list
fi
