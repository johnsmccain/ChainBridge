#!/bin/bash
# =============================================================================
# ChainBridge Contract Rollback Script
# =============================================================================
# Re-upgrades the contract to the previous WASM hash recorded in .deployed.
# Requires the previous WASM to still be accessible on-chain (it is - uploaded
# WASMs are immutable and persist on Stellar).
#
# Usage:
#   ./scripts/rollback.sh [--config <env-file>] [--contract <id>] [--to-hash <hash>]
#
# Options:
#   --config    Path to env file (default: scripts/config/testnet.env)
#   --contract  Contract ID (overrides .deployed file)
#   --to-hash   WASM hash to roll back to (overrides PREV_WASM_HASH in .deployed)
#   --dry-run   Print commands without executing
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config/testnet.env"
CONTRACT_ID_OVERRIDE=""
TARGET_HASH_OVERRIDE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --config)    CONFIG_FILE="$2"; shift 2 ;;
        --contract)  CONTRACT_ID_OVERRIDE="$2"; shift 2 ;;
        --to-hash)   TARGET_HASH_OVERRIDE="$2"; shift 2 ;;
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

DEPLOYED_INFO="${SCRIPT_DIR}/config/.deployed"
if [[ -f "$DEPLOYED_INFO" ]]; then
    # shellcheck source=/dev/null
    source "$DEPLOYED_INFO"
fi

if [[ -n "$CONTRACT_ID_OVERRIDE" ]]; then CONTRACT_ID="$CONTRACT_ID_OVERRIDE"; fi
if [[ -n "$TARGET_HASH_OVERRIDE" ]]; then PREV_WASM_HASH="$TARGET_HASH_OVERRIDE"; fi

for var in STELLAR_NETWORK DEPLOYER_SECRET_KEY CONTRACT_ID PREV_WASM_HASH; do
    if [[ -z "${!var:-}" ]]; then
        echo "ERROR: $var is not set. Pass --to-hash or run upgrade.sh first."
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
echo "ChainBridge Rollback - ${STELLAR_NETWORK}"
echo "Contract : ${CONTRACT_ID}"
echo "Target   : ${PREV_WASM_HASH}"
echo "============================================"
echo ""
echo "WARNING: Rolling back will revert the on-chain logic to the previous WASM."
echo "Any storage schema changes introduced by the upgrade will remain - ensure"
echo "the previous WASM is compatible with the current storage layout."
echo ""
read -r -p "Proceed with rollback? [y/N] " confirm
if [[ "${confirm,,}" != "y" ]]; then
    echo "Rollback aborted."
    exit 0
fi

echo ""
echo "--- Invoking upgrade with previous WASM hash ---"
run stellar contract invoke \
    --network "${STELLAR_NETWORK}" \
    --source "${DEPLOYER_SECRET_KEY}" \
    --id "${CONTRACT_ID}" \
    -- upgrade \
    --new_wasm_hash "${PREV_WASM_HASH}"

echo ""
echo "--- Verifying rollback ---"
"${SCRIPT_DIR}/verify.sh" --contract "${CONTRACT_ID}" --config "${CONFIG_FILE}"

# Clear previous hash to prevent double rollback
CURRENT_HASH="${WASM_HASH:-unknown}"
echo "CONTRACT_ID=${CONTRACT_ID}" > "${DEPLOYED_INFO}"
echo "WASM_HASH=${PREV_WASM_HASH}" >> "${DEPLOYED_INFO}"
echo "PREV_WASM_HASH=${CURRENT_HASH}" >> "${DEPLOYED_INFO}"
echo "ROLLED_BACK_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${DEPLOYED_INFO}"

echo ""
echo "============================================"
echo "Rollback complete."
echo "  Contract ID  : ${CONTRACT_ID}"
echo "  Active WASM  : ${PREV_WASM_HASH}"
echo "============================================"
