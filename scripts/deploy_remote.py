#!/usr/bin/env python3
"""Eerste deploy / full deploy: tarball → /var/www/aantekeningen → npm → PM2."""
from __future__ import annotations

import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "192.168.1.32")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "kerkpoort")
REMOTE_DIR = os.environ.get("DEPLOY_DIR", "/var/www/aantekeningen")
DB_HOST = os.environ.get("DB_HOST", "192.168.1.14")
DB_USER = os.environ.get("DB_USER", "aantekeningen")
DB_PASS = os.environ.get("DB_PASS", "kerkpoort")
DB_NAME = os.environ.get("DB_NAME", "aantekeningen")
PROJECT_ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {"node_modules", ".next", ".git", ".cursor", "__pycache__", "data"}
SKIP_FILES = {".env.local", ".env"}


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
    if err.strip() and code != 0:
        print(err.rstrip(), file=sys.stderr)
    if check and code != 0:
        raise RuntimeError(f"Command failed ({code}): {cmd}\n{err}")
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
    run(ssh, f"mkdir -p {REMOTE_DIR}")
    run(ssh, f"mkdir -p {REMOTE_DIR}/data/uploads")

    tar_path = tempfile.mktemp(suffix=".tar.gz")
    try:
        with tarfile.open(tar_path, "w:gz") as tar:
            for path in PROJECT_ROOT.rglob("*"):
                rel = path.relative_to(PROJECT_ROOT)
                if rel.parts and rel.parts[0] in SKIP_DIRS:
                    continue
                if any(p in SKIP_DIRS for p in rel.parts):
                    continue
                if path.name in SKIP_FILES:
                    continue
                if path.is_file():
                    tar.add(path, arcname=str(rel).replace("\\", "/"))

        sftp = ssh.open_sftp()
        remote_tar = "/tmp/aantekeningen-deploy.tar.gz"
        print(f"Uploading {os.path.getsize(tar_path) // 1024} KB...")
        sftp.put(tar_path, remote_tar)
        sftp.close()
        run(ssh, f"tar -xzf {remote_tar} -C {REMOTE_DIR}")
        run(ssh, f"rm -f {remote_tar}")
    finally:
        if os.path.exists(tar_path):
            os.unlink(tar_path)

    # .env.local alleen aanmaken als die nog niet bestaat
    run(
        ssh,
        f"test -f {REMOTE_DIR}/.env.local || cat > {REMOTE_DIR}/.env.local << 'ENVEOF'\n{env_content}ENVEOF",
    )

    run(ssh, "node -v && npm -v")
    run(ssh, f"cd {REMOTE_DIR} && npm ci", timeout=600)
    run(ssh, f"cd {REMOTE_DIR} && npm run build", timeout=600)

    run(ssh, "npm install -g pm2", check=False)
    run(ssh, "pm2 delete aantekeningen 2>/dev/null; true", check=False)
    run(ssh, f"cd {REMOTE_DIR} && pm2 start ecosystem.config.cjs && pm2 save")
    run(ssh, "sleep 2 && pm2 list", check=False)
    run(ssh, "curl -s -o /dev/null -w '%{http_code}\\n' http://127.0.0.1:3008/", check=False)
    run(ssh, "curl -s http://127.0.0.1:3008/api/notes | head -c 300", check=False)

    print("\n=== Deploy done ===")
    print(f"App: http://{HOST}:3008  dir={REMOTE_DIR}")
    ssh.close()


if __name__ == "__main__":
    main()
