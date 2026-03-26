#!/bin/bash
# =============================================================================
# ChainBridge Testnet Deployment Script
# =============================================================================
# Builds the WASM, uploads the contract to Stellar testnet, and initializes
# the ChainBridge admin.
#
# Usage:
#   ./scripts/deploy.sh [--config <env-file>] [--wasm <path>] [--dry-run]
#
# Options:
#   --config   Path to env file (default: scripts/config/testnet.env)
#   --wasm     Path to pre-built WASM (skips cargo build)
#   --dry-run  Print commands without executing
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config/testnet.env"
WASM_OVERRIDE=""
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --config)  CONFIG_FILE="$2"; shift 2 ;;
        --wasm)    WASM_OVERRIDE="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *)         echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Load configuration
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "ERROR: Config file not found: $CONFIG_FILE"
    echo "Copy scripts/config/testnet.env to scripts/config/testnet.env.local and set values."
    exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG_FILE"

# Validate required variables
for var in STELLAR_NETWORK SOROBAN_RPC_URL DEPLOYER_SECRET_KEY ADMIN_ADDRESS; do
    if [[ -z "${!var:-}" ]]; then
        echo "ERROR: $var is not set in $CONFIG_FILE"
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
echo "ChainBridge Deployment - ${STELLAR_NETWORK}"
echo "============================================"

# Step 1: Build WASM
if [[ -n "$WASM_OVERRIDE" ]]; then
    WASM_PATH="$WASM_OVERRIDE"
    echo "Using pre-built WASM: $WASM_PATH"
else
    echo ""
    echo "--- Building contract WASM ---"
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
echo "WASM: $WASM_PATH ($(du -sh "$WASM_PATH" | cut -f1))"

# Step 2: Upload WASM
echo ""
echo "--- Uploading WASM to ${STELLAR_NETWORK} ---"
WASM_HASH=$(run stellar contract upload \
    --network "${STELLAR_NETWORK}" \
    --source "${DEPLOYER_SECRET_KEY}" \
    --wasm "${WASM_PATH}")
echo "WASM hash: ${WASM_HASH}"

# Step 3: Deploy contract instance
echo ""
echo "--- Deploying contract instance ---"
CONTRACT_ID=$(run stellar contract deploy \
    --network "${STELLAR_NETWORK}" \
    --source "${DEPLOYER_SECRET_KEY}" \
    --wasm-hash "${WASM_HASH}")
echo "Contract ID: ${CONTRACT_ID}"

# Step 4: Initialize contract
echo ""
echo "--- Initializing contract (admin: ${ADMIN_ADDRESS}) ---"
run stellar contract invoke \
    --network "${STELLAR_NETWORK}" \
    --source "${DEPLOYER_SECRET_KEY}" \
    --id "${CONTRACT_ID}" \
    -- init \
    --admin "${ADMIN_ADDRESS}"

# Step 5: Verify deployment
echo ""
echo "--- Verifying deployment ---"
"${SCRIPT_DIR}/verify.sh" --contract "${CONTRACT_ID}" --config "${CONFIG_FILE}"

# Persist the deployed contract ID for upgrade and rollback scripts
DEPLOYED_INFO="${SCRIPT_DIR}/config/.deployed"
echo "CONTRACT_ID=${CONTRACT_ID}" > "${DEPLOYED_INFO}"
echo "WASM_HASH=${WASM_HASH}" >> "${DEPLOYED_INFO}"
echo "DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${DEPLOYED_INFO}"

echo ""
echo "============================================"
echo "Deployment complete."
echo "  Contract ID : ${CONTRACT_ID}"
echo "  WASM hash   : ${WASM_HASH}"
echo "  Network     : ${STELLAR_NETWORK}"
echo "  Info saved  : ${DEPLOYED_INFO}"
echo "============================================"
