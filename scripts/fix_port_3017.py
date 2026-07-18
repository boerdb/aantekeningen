#!/usr/bin/env python3
"""Zet aantekeningen op poort 3017 en herstart PM2."""
from __future__ import annotations

import sys

import paramiko

HOST = "192.168.1.32"
REMOTE = "/var/www/aantekeningen"
ECOSYSTEM = """/** PM2 — Scheikunde Aantekeningen (poort 3017). */
module.exports = {
  apps: [
    {
      name: "aantekeningen",
      cwd: "/var/www/aantekeningen",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3017,
        TZ: "Europe/Amsterdam",
      },
    },
  ],
};
"""


def run(ssh: paramiko.SSHClient, cmd: str, check: bool = True) -> str:
    print(f"$ {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    text = out + (("\n" + err) if err and code != 0 else "")
    sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
    sys.stdout.buffer.write(b"\n")
    sys.stdout.flush()
    if check and code != 0:
        raise RuntimeError(f"failed ({code}): {cmd}")
    return out


def main() -> None:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username="root", password="kerkpoort", timeout=30)

    sftp = ssh.open_sftp()
    with sftp.file(f"{REMOTE}/ecosystem.config.cjs", "w") as f:
        f.write(ECOSYSTEM)
    sftp.close()

    # PORT in .env.local (Next leest dit ook)
    run(
        ssh,
        f"grep -q '^PORT=' {REMOTE}/.env.local && sed -i 's/^PORT=.*/PORT=3017/' {REMOTE}/.env.local || echo 'PORT=3017' >> {REMOTE}/.env.local",
    )

    run(ssh, "pm2 delete aantekeningen 2>/dev/null; true", check=False)
    # eventuele zombie op 3017
    run(ssh, "fuser -k 3017/tcp 2>/dev/null; true", check=False)
    run(ssh, f"cd {REMOTE} && pm2 start ecosystem.config.cjs && pm2 save")
    run(ssh, "sleep 3 && pm2 describe aantekeningen | head -25", check=False)
    run(ssh, "ss -tlnp | grep 3017 || true", check=False)
    run(
        ssh,
        "curl -sS -m 8 -o /dev/null -w 'home:%{http_code}\\n' http://127.0.0.1:3017/",
        check=False,
    )
    run(ssh, "curl -sS -m 8 http://127.0.0.1:3017/api/notes", check=False)
    ssh.close()
    print("OK → http://192.168.1.32:3017")


if __name__ == "__main__":
    main()
