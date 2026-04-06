#!/bin/bash
# Source this file to make Claude Code use the Shadow Stack free-models-proxy
# as its Anthropic endpoint. The proxy translates /v1/messages (Anthropic)
# to the internal cascade, which puts omniroute (free Claude Sonnet 4.5
# via AWS Builder ID) at tier 0.
#
# Usage:
#   source .agent/env.claude-code.sh
#   claude
#
# To revert:
#   unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN
export ANTHROPIC_BASE_URL="http://localhost:20129"
export ANTHROPIC_AUTH_TOKEN="shadow-free-proxy-local-dev-key"
echo "Claude Code → shadow proxy (:20129 → cascade → omniroute tier 0)"
