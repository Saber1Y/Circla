#!/usr/bin/env bash
# Deploys a new CirclaVault to Base mainnet with a private key.
#
#   script/deploy-mainnet.sh
#
# The key comes from DEPLOYER_PRIVATE_KEY, or a hidden prompt when it is unset,
# so it never lands in shell history or the process list. Settings come from
# the environment (see script/DeployMainnetVault.s.sol for every variable).
#
# Flow: preflight checks -> unit tests -> simulation against live Base state ->
# typed confirmation -> broadcast (+ Basescan verification when
# BASESCAN_API_KEY is set) -> deployment record in deployments/.
set -euo pipefail

cd "$(dirname "$0")/.."

RPC_URL="${BASE_RPC_URL:-https://mainnet.base.org}"
SCRIPT="script/DeployMainnetVault.s.sol"
BROADCAST_LOG="broadcast/DeployMainnetVault.s.sol/8453/run-latest.json"

fail() {
  echo "error: $*" >&2
  exit 1
}

for tool in forge cast python3 git; do
  command -v "$tool" >/dev/null || fail "$tool is not installed"
done

chain_id="$(cast chain-id --rpc-url "$RPC_URL")" || fail "cannot reach $RPC_URL"
[ "$chain_id" = "8453" ] || fail "$RPC_URL is chain $chain_id, not Base mainnet (8453)"

if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  read -r -s -p "Deployer private key (input hidden): " DEPLOYER_PRIVATE_KEY || DEPLOYER_PRIVATE_KEY=""
  echo
fi
[ -n "$DEPLOYER_PRIVATE_KEY" ] || fail "no private key given"
case "$DEPLOYER_PRIVATE_KEY" in 0x*) ;; *) DEPLOYER_PRIVATE_KEY="0x$DEPLOYER_PRIVATE_KEY" ;; esac
export DEPLOYER_PRIVATE_KEY

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ -n "$(git status --porcelain -- src script)" ]; then
  fail "uncommitted changes in src/ or script/; commit them so the deployed bytecode matches a commit"
fi
if [ "$branch" != "main" ]; then
  echo "warning: deploying from branch '$branch', not main"
fi

echo "==> Running unit tests"
forge test --no-match-contract Fork >/dev/null || fail "forge test failed; fix the tests before deploying"

echo "==> Simulating against live Base state (nothing is sent)"
forge script "$SCRIPT" --rpc-url "$RPC_URL" || fail "simulation failed; nothing was sent"

echo
echo "That was a simulation only (ignore forge's --broadcast hint): nothing has been sent."
echo "Review the deployer, owner, settings and invites above."
read -r -p "Type DEPLOY to broadcast to Base mainnet: " answer
[ "$answer" = "DEPLOY" ] || fail "aborted; nothing was sent"

verify_args=()
if [ -n "${BASESCAN_API_KEY:-}" ]; then
  verify_args=(--verify)
else
  echo "warning: BASESCAN_API_KEY is unset, so the contract will not be verified on Basescan"
fi

echo "==> Broadcasting"
forge script "$SCRIPT" --rpc-url "$RPC_URL" --broadcast --slow "${verify_args[@]+"${verify_args[@]}"}" \
  || fail "broadcast failed; check $BROADCAST_LOG for any transaction that did land"

record="$(python3 - "$BROADCAST_LOG" "$(git rev-parse HEAD)" <<'PY'
import json, sys, time
log, commit = sys.argv[1], sys.argv[2]
run = json.load(open(log))
create = next(t for t in run["transactions"] if t["transactionType"] == "CREATE" and t["contractName"] == "CirclaVault")
receipt = next(r for r in run["receipts"] if r["transactionHash"] == create["hash"])
record = {
    "network": "base-mainnet",
    "chainId": 8453,
    "vault": create["contractAddress"],
    "deployTx": create["hash"],
    "deployBlock": int(receipt["blockNumber"], 16),
    "transactions": [t["hash"] for t in run["transactions"]],
    "commit": commit,
    "deployedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
}
print(json.dumps(record, indent=2))
PY
)" || fail "deployed, but could not read $BROADCAST_LOG; take the vault address from the output above"

vault="$(cast to-check-sum-address "$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["vault"])' "$record")")"
record="$(python3 -c 'import json,sys; r=json.loads(sys.argv[1]); r["vault"]=sys.argv[2]; print(json.dumps(r, indent=2))' "$record" "$vault")"
block="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["deployBlock"])' "$record")"
out="deployments/base-mainnet-vault-$(date -u +%Y%m%dT%H%M%SZ).json"
printf '%s\n' "$record" > "$out"

cat <<EOF

Deployed CirclaVault $vault at block $block.
Record written to $out.

Next (docs/REDEPLOY_RUNBOOK.md, steps 4 to 7):
  - Point CIRCLA_VAULT_ADDRESS (render.yaml, bot/.env.example), bot/seed/circles.json
    and DEFAULT_VAULT in web/app/page.tsx at $vault
  - Set VAULT_DEPLOY_BLOCK in bot/src/base-client.mjs to ${block}n
  - Basescan: https://basescan.org/address/$vault
EOF
