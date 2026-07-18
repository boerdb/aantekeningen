#!/usr/bin/env python3
"""Zet OCR_PROVIDER=tesseract, pull, build, PM2 restart."""
from __future__ import annotations

import sys

import paramiko

HOST = "192.168.1.32"
REMOTE = "/var/www/aantekeningen"


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 600) -> int:
    print(f"$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    text = out.rstrip()
    if text:
        sys.stdout.buffer.write((text[-2500:] + "\n").encode("utf-8", errors="replace"))
        sys.stdout.flush()
    if code != 0:
        sys.stderr.buffer.write((err.rstrip() + "\n").encode("utf-8", errors="replace"))
        raise RuntimeError(f"failed ({code}): {cmd}")
    return code


def main() -> None:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username="root", password="kerkpoort", timeout=30)

    run(
        ssh,
        f"grep -q '^OCR_PROVIDER=' {REMOTE}/.env.local && "
        f"sed -i 's/^OCR_PROVIDER=.*/OCR_PROVIDER=tesseract/' {REMOTE}/.env.local || "
        f"echo 'OCR_PROVIDER=tesseract' >> {REMOTE}/.env.local",
    )
    run(ssh, f"cd {REMOTE} && git pull origin main")
    run(ssh, f"cd {REMOTE} && npm ci")
    run(ssh, f"cd {REMOTE} && npm run build")
    run(ssh, "pm2 restart aantekeningen --update-env", timeout=60)
    run(
        ssh,
        "sleep 2 && curl -sS -m 8 http://127.0.0.1:3017/api/ocr/providers",
        timeout=30,
    )
    ssh.close()
    print("OK: Tesseract OCR actief op :3017")


if __name__ == "__main__":
    main()
