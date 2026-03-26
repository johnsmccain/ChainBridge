#!/bin/bash
# =============================================================================
# ChainBridge Contract Upgrade Script
# =============================================================================
# Uploads a new WASM and upgrades an existing contract instance in place.
# The contract must expose an `upgrade` entrypoint that accepts a WASM hash.
#
# Usage:
#   ./scripts/upgrade.sh [--config <env-file>] [--contract <id>] [--wasm <path>]
#
# Options:
#   --config    Path to env file (default: scripts/config/testnet.env)
#   --contract  Existing contract ID to upgrade (overrides .deployed file)
#   --wasm      Path to pre-built WASM (skips cargo build)
#   --dry-run   Print commands without executing
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config/testnet.env"
CONTRACT_ID_OVERRIDE=""
WASM_OVERRIDE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --config)    CONFIG_FILE="$2"; shift 2 ;;
        --contract)  CONTRACT_ID_OVERRIDE="$2"; shift 2 ;;
        --wasm)      WASM_OVERRIDE="$2"; shift 2 ;;
        --dry-run)   DRY_RUN=true; shift ;;
        *)           echo "Unknown option: $1"; exit 1 ;;
    esac
done

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "ERROR: Config file not found: $CONFIG_FILE"
    exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG_FILE"

# Load previously deployed contract ID if not overridden
DEPLOYED_INFO="${SCRIPT_DIR}/config/.deployed"
if [[ -z "$CONTRACT_ID_OVERRIDE" ]]; then
    if [[ ! -f "$DEPLOYED_INFO" ]]; then
        echo "ERROR: No .deployed file found. Run deploy.sh first or pass --contract."
        exit 1
    fi
    # shellcheck source=/dev/null
    source "$DEPLOYED_INFO"
else
    CONTRACT_ID="$CONTRACT_ID_OVERRIDE"
fi

for var in STELLAR_NETWORK SOROBAN_RPC_URL DEPLOYER_SECRET_KEY CONTRACT_ID; do
    if [[ -z "${!var:-}" ]]; then
        echo "ERROR: $var is not set"
        exit 1
    fi
done

run() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[dry-run] $*"
    else
        echo "+ $*"
        "$@"
    fi
}

echo "============================================"
echo "ChainBridge Upgrade - ${STELLAR_NETWORK}"
echo "Contract: ${CONTRACT_ID}"
echo "============================================"

# Save previous WASM hash for potential rollback
PREV_WASM_HASH="${WASM_HASH:-unknown}"
echo "Previous WASM hash: ${PREV_WASM_HASH}"

# Step 1: Build new WASM
if [[ -n "$WASM_OVERRIDE" ]]; then
    WASM_PATH="$WASM_OVERRIDE"
    echo "Using pre-built WASM: $WASM_PATH"
else
    echo ""
    echo "--- Building new contract WASM ---"
    run cargo build \
        --manifest-path "${REPO_ROOT}/smartcontract/Cargo.toml" \
        --release \
        --target wasm32-unknown-unknown
    WASM_PATH="${REPO_ROOT}/smartcontract/target/wasm32-unknown-unknown/release/chainbridge.wasm"
fi

if [[ ! -f "$WASM_PATH" ]]; then
    echo "ERROR: WASM not found at $WASM_PATH"
    exit 1
fi

# Step 2: Upload new WASM
echo ""
echo "--- Uploading new WASM ---"
NEW_WASM_HASH=$(run stellar contract upload \
    --network "${STELLAR_NETWORK}" \
    --source "${DEPLOYER_SECRET_KEY}" \
    --wasm "${WASM_PATH}")
echo "New WASM hash: ${NEW_WASM_HASH}"

# Step 3: Invoke upgrade entrypoint
echo ""
echo "--- Upgrading contract ---"
run stellar contract invoke \
    --network "${STELLAR_NETWORK}" \
    --source "${DEPLOYER_SECRET_KEY}" \
    --id "${CONTRACT_ID}" \
    -- upgrade \
    --new_wasm_hash "${NEW_WASM_HASH}"

# Step 4: Verify
echo ""
echo "--- Verifying upgrade ---"
"${SCRIPT_DIR}/verify.sh" --contract "${CONTRACT_ID}" --config "${CONFIG_FILE}"

# Persist updated state
echo "CONTRACT_ID=${CONTRACT_ID}" > "${DEPLOYED_INFO}"
echo "WASM_HASH=${NEW_WASM_HASH}" >> "${DEPLOYED_INFO}"
echo "PREV_WASM_HASH=${PREV_WASM_HASH}" >> "${DEPLOYED_INFO}"
echo "UPGRADED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${DEPLOYED_INFO}"

echo ""
echo "============================================"
echo "Upgrade complete."
echo "  Contract ID      : ${CONTRACT_ID}"
echo "  New WASM hash    : ${NEW_WASM_HASH}"
echo "  Previous hash    : ${PREV_WASM_HASH}"
echo "  To rollback run  : ./scripts/rollback.sh"
echo "============================================"
