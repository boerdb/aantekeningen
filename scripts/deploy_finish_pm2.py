#!/usr/bin/env python3
"""Build (indien nodig) + PM2 start voor aantekeningen."""
from __future__ import annotations

import os
import sys

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "192.168.1.32")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "kerkpoort")
REMOTE_DIR = os.environ.get("DEPLOY_DIR", "/var/www/aantekeningen")


def run(ssh: paramiko.SSHClient, cmd: str, check: bool = True, timeout: int = 600) -> int:
    print(f"$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    text = (out or "") + (("\n" + err) if err and code != 0 else "")
    try:
        sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.flush()
    except Exception:
        print(text.encode("ascii", errors="replace").decode("ascii"))
    if check and code != 0:
        raise RuntimeError(f"failed ({code}): {cmd}")
    return code


def main() -> None:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(ssh, f"test -f {REMOTE_DIR}/.env.local && echo HAS_ENV")
    run(ssh, f"cd {REMOTE_DIR} && npm run build", timeout=600)
    run(ssh, "npm install -g pm2", check=False, timeout=180)
    run(ssh, "pm2 delete aantekeningen 2>/dev/null; true", check=False)
    run(ssh, f"cd {REMOTE_DIR} && pm2 start ecosystem.config.cjs && pm2 save")
    run(ssh, "sleep 3 && pm2 list", check=False)
    run(
        ssh,
        "curl -s -o /dev/null -w 'HTTP %{http_code}\\n' http://127.0.0.1:3017/",
        check=False,
    )
    run(ssh, "curl -s http://127.0.0.1:3017/api/notes | head -c 400", check=False)
    ssh.close()
    print("=== PM2 finish OK ===")
    print(f"http://{HOST}:3017")


if __name__ == "__main__":
    main()
