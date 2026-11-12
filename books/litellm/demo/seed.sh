#!/usr/bin/env bash
# 在空库上种入和书中截图同一形状的两个团队、两把虚拟密钥。
# 不打印主密钥。虚拟密钥原文只在本次输出里出现一次。
# 截图里的 team_id 和密钥末四位属于 2026-11-12 那次库，重跑会得到新的。
set -euo pipefail

BASE="${LITELLM_BASE:-http://127.0.0.1:4000}"
: "${LITELLM_MASTER_KEY:?set LITELLM_MASTER_KEY}"

echo "等待数据库就绪……"
ready=0
for _ in $(seq 1 60); do
  if curl -fsS "$BASE/health/readiness" \
    -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" >/dev/null; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" != 1 ]; then
  echo "readiness 在两分钟内没有成功。先看 docker compose logs litellm。" >&2
  exit 1
fi

post() {
  curl -fsS -X POST "$BASE$1" \
    -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" \
    -H "Content-Type: application/json" \
    -d "$2"
}

team_id() {
  python3 -c 'import json,sys
data=json.load(sys.stdin)
tid=data.get("team_id")
if not tid:
    sys.stderr.write("响应里没有 team_id\n")
    sys.exit(1)
print(tid)'
}

echo "== team seashore-main =="
SEASHORE_ID="$(post /team/new '{
  "team_alias": "seashore-main",
  "max_budget": 50,
  "models": ["seashore-cs", "seashore-cs-fast"]
}' | team_id)"
echo "team_id=$SEASHORE_ID"

echo "== team aurora-main =="
AURORA_ID="$(post /team/new '{
  "team_alias": "aurora-main",
  "max_budget": 30,
  "models": ["aurora-cs"]
}' | team_id)"
echo "team_id=$AURORA_ID"

echo "== key alice（原文只此一次） =="
post /key/generate "{
  \"key_alias\": \"alice\",
  \"team_id\": \"${SEASHORE_ID}\",
  \"models\": [\"seashore-cs\", \"seashore-cs-fast\"],
  \"max_budget\": 10,
  \"rpm_limit\": 30
}"
echo
echo "== key bob（原文只此一次） =="
post /key/generate "{
  \"key_alias\": \"bob\",
  \"team_id\": \"${AURORA_ID}\",
  \"models\": [\"aurora-cs\"],
  \"max_budget\": 8,
  \"rpm_limit\": 20
}"
echo
echo "Budget Reset 在 2026-11-12 的密钥表上是 Never，所以上面没有传 budget_duration。"
echo "默认列不显示 RPM。alice 的 30 和 bob 的 20 要在钥匙详情里核对，不能凭列表说没有限流。"
