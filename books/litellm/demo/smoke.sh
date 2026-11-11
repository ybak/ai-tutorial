#!/usr/bin/env bash
# 对已经启动的本地代理做只读冒烟。不创建密钥，不打印 Authorization。
# 用法：先按 README 执行 docker compose up，再导出 LITELLM_MASTER_KEY，然后执行本脚本。
# 它证明网关和主上游活着。虚拟密钥的名单要另用 alice / bob 的钥匙看。
set -euo pipefail

BASE="${LITELLM_BASE:-http://127.0.0.1:4000}"
: "${LITELLM_MASTER_KEY:?set LITELLM_MASTER_KEY}"

echo "== liveliness =="
curl -fsS "$BASE/health/liveliness"
echo
echo "== readiness =="
curl -fsS "$BASE/health/readiness" -H "Authorization: Bearer ${LITELLM_MASTER_KEY}"
echo
echo "== models =="
curl -fsS "$BASE/v1/models" -H "Authorization: Bearer ${LITELLM_MASTER_KEY}"
echo
echo "== chat seashore-cs =="
curl -fsS "$BASE/v1/chat/completions" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"seashore-cs","messages":[{"role":"user","content":"订单 OD-2049 为什么还没到？"}]}'
echo
