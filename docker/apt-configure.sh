#!/usr/bin/env bash
#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root" >&2
  exit 1
fi

rewrite_sources() {
  local target=$1
  local scheme=$2

  sed -ri \
    -e "s|https?://deb\\.debian\\.org/|${scheme}://deb.debian.org/|g" \
    -e "s|https?://security\\.debian\\.org/|${scheme}://security.debian.org/|g" \
    "$target"
}

APT_MIRROR_SCHEME="https"

# Corporate proxies may terminate TLS with an internal CA that is not yet
# trusted inside the base image. In that case, keep Debian mirrors on HTTP so
# apt can still use the proxy without certificate bootstrap issues.
if [[ -n "${http_proxy:-}" || -n "${HTTP_PROXY:-}" || -n "${https_proxy:-}" || -n "${HTTPS_PROXY:-}" ]]; then
  APT_MIRROR_SCHEME="http"
fi

if [[ -f /etc/apt/sources.list ]]; then
  rewrite_sources /etc/apt/sources.list "$APT_MIRROR_SCHEME"
fi

if [[ -d /etc/apt/sources.list.d ]]; then
  while IFS= read -r -d '' source_file; do
    rewrite_sources "$source_file" "$APT_MIRROR_SCHEME"
  done < <(
    find /etc/apt/sources.list.d -type f \
      \( -name '*.list' -o -name '*.sources' \) -print0
  )
fi

cat > /etc/apt/apt.conf.d/99network-resilience <<'EOF'
Acquire::Retries "5";
Acquire::http::Timeout "30";
Acquire::https::Timeout "30";
EOF
