#!/usr/bin/env python3
"""Eerste keer: git clone op NEXT-server, .env.local, build, PM2 (blijft synchroon met GitHub)."""
from __future__ import annotations

import os
import sys

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "192.168.1.32")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "kerkpoort")
REMOTE_DIR = os.environ.get("DEPLOY_DIR", "/var/www/aantekeningen")
REPO = os.environ.get(
    "DEPLOY_REPO",
    "git@github.com:boerdb/aantekeningen.git",
)
DB_HOST = os.environ.get("DB_HOST", "192.168.1.14")
DB_USER = os.environ.get("DB_USER", "aantekeningen")
DB_PASS = os.environ.get("DB_PASS", "kerkpoort")
DB_NAME = os.environ.get("DB_NAME", "aantekeningen")


def run(
    ssh: paramiko.SSHClient,
    cmd: str,
    check: bool = True,
    timeout: int = 600,
) -> tuple[int, str, str]:
    print(f"$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.rstrip())
    if check and code != 0:
        print(err.rstrip(), file=sys.stderr)
        raise RuntimeError(f"failed ({code}): {cmd}")
    return code, out, err


def main() -> None:
    env_content = f"""DATABASE_URL=mysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306/{DB_NAME}
OCR_PROVIDER=manual
NODE_ENV=production
"""

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{HOST}...")
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    run(ssh, "mkdir -p /var/www")
    code, _, _ = run(ssh, f"test -d {REMOTE_DIR}/.git", check=False)
    if code != 0:
        run(ssh, f"rm -rf {REMOTE_DIR}")
        run(ssh, f"git clone {REPO} {REMOTE_DIR}", timeout=300)
    else:
        run(ssh, f"cd {REMOTE_DIR} && git fetch origin && git checkout main && git reset --hard origin/main")

    run(ssh, f"mkdir -p {REMOTE_DIR}/data/uploads")
    run(
        ssh,
        f"test -f {REMOTE_DIR}/.env.local || cat > {REMOTE_DIR}/.env.local << 'ENVEOF'\n{env_content}ENVEOF",
    )

    run(ssh, f"cd {REMOTE_DIR} && npm ci", timeout=600)
    run(ssh, f"cd {REMOTE_DIR} && npm run build", timeout=600)
    run(ssh, "npm install -g pm2", check=False)
    run(ssh, "pm2 delete aantekeningen 2>/dev/null; true", check=False)
    run(ssh, f"cd {REMOTE_DIR} && pm2 start ecosystem.config.cjs && pm2 save")
    run(ssh, "sleep 3 && pm2 list", check=False)
    run(ssh, "curl -s -o /dev/null -w 'HTTP %{http_code}\\n' http://127.0.0.1:3008/", check=False)
    run(ssh, "curl -s http://127.0.0.1:3008/api/notes | head -c 400", check=False)

    print("\n=== Git deploy done ===")
    print(f"http://{HOST}:3008  ({REMOTE_DIR})")
    ssh.close()


if __name__ == "__main__":
    main()
