#!/usr/bin/env bash

set -euo pipefail

if ! command -v gitleaks >/dev/null 2>&1; then
  cat <<'EOF'
Commit blocked: gitleaks is not installed.
Install gitleaks locally to enable mandatory secret scanning before commit.
EOF
  exit 1
fi

if gitleaks protect --help >/dev/null 2>&1; then
  gitleaks protect --staged --redact --verbose
  exit 0
fi

# Fallback for newer CLI variants.
gitleaks git --staged --redact --verbose
