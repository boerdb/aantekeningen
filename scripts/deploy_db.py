#!/usr/bin/env python3
"""Schema + grants op MySQL-server 192.168.1.14 voor aantekeningen."""
from __future__ import annotations

import os
from pathlib import Path

import paramiko

DB_HOST = os.environ.get("DB_SSH_HOST", "192.168.1.14")
NEXT_HOST = os.environ.get("NEXT_HOST", "192.168.1.32")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "kerkpoort")
DB_USER = os.environ.get("DB_USER", "aantekeningen")
DB_PASS = os.environ.get("DB_PASS", "kerkpoort")
DB_NAME = os.environ.get("DB_NAME", "aantekeningen")
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def run(ssh: paramiko.SSHClient, cmd: str) -> None:
    print(f"$ {cmd[:120]}...")
    _, stdout, stderr = ssh.exec_command(cmd, get_pty=True, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.rstrip())
    if code != 0:
        raise RuntimeError(err or out or f"exit {code}")


def main() -> None:
    schema = (PROJECT_ROOT / "sql" / "schema.sql").read_text(encoding="utf-8")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {USER}@{DB_HOST}...")
    ssh.connect(DB_HOST, username=USER, password=PASSWORD, timeout=30)

    sftp = ssh.open_sftp()
    with sftp.file("/tmp/aantekeningen-schema.sql", "w") as f:
        f.write(schema)
    sftp.close()

    run(ssh, f"mysql -uroot -p{PASSWORD} < /tmp/aantekeningen-schema.sql")
    run(
        ssh,
        f"""mysql -uroot -p{PASSWORD} -e "
CREATE USER IF NOT EXISTS '{DB_USER}'@'{NEXT_HOST}' IDENTIFIED BY '{DB_PASS}';
CREATE USER IF NOT EXISTS '{DB_USER}'@'192.168.1.%' IDENTIFIED BY '{DB_PASS}';
GRANT SELECT, INSERT, UPDATE, DELETE ON {DB_NAME}.* TO '{DB_USER}'@'{NEXT_HOST}';
GRANT SELECT, INSERT, UPDATE, DELETE ON {DB_NAME}.* TO '{DB_USER}'@'192.168.1.%';
FLUSH PRIVILEGES;
SHOW GRANTS FOR '{DB_USER}'@'{NEXT_HOST}';
" """,
    )
    run(ssh, f"rm -f /tmp/aantekeningen-schema.sql")
    print("DB OK:", DB_NAME, "user", DB_USER, "from", NEXT_HOST)
    ssh.close()


if __name__ == "__main__":
    main()
