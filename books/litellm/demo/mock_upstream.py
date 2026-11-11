#!/usr/bin/env python3
"""最小 OpenAI Chat Completions 模拟上游。

没有真实厂商密钥。响应正文固定带上 MOCK_NAME，方便确认请求打到了哪一个进程。
MOCK_MODE=fail 时返回 HTTP 500，用来配合网关降级。
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

NAME = os.environ.get("MOCK_NAME", "primary")
MODE = os.environ.get("MOCK_MODE", "ok")


class Handler(BaseHTTPRequestHandler):
    def _json(self, code, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw_body = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw_body.decode() or "{}")
        except json.JSONDecodeError:
            body = {}
        if MODE == "fail":
            self._json(
                500,
                {
                    "error": {
                        "message": f"{NAME} upstream down",
                        "type": "server_error",
                        "code": "mock_down",
                    }
                },
            )
            return
        model = body.get("model", "unknown")
        self._json(
            200,
            {
                "id": f"chatcmpl-{NAME}",
                "object": "chat.completion",
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {
                            "role": "assistant",
                            "content": f"[{NAME}] 订单 OD-2049 仍在途。请核对运单后再答复客户。",
                        },
                    }
                ],
                "usage": {
                    "prompt_tokens": 18,
                    "completion_tokens": 22,
                    "total_tokens": 40,
                },
            },
        )

    def do_GET(self):
        self._json(200, {"status": "ok", "name": NAME, "mode": MODE})

    def log_message(self, fmt, *args):
        sys.stderr.write(f"{NAME} {fmt % args}\n")


def main():
    if len(sys.argv) != 2:
        sys.stderr.write("usage: mock_upstream.py <port>\n")
        sys.exit(2)
    port = int(sys.argv[1])
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
