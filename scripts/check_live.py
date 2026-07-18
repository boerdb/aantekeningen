#!/usr/bin/env python3
import sys

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("192.168.1.32", username="root", password="kerkpoort", timeout=30)

cmds = [
    "pm2 jlist | python3 -c \"import sys,json; d=json.load(sys.stdin); a=[x for x in d if x.get('name')=='aantekeningen']; print(a[0]['pm2_env']['status'] if a else 'missing', a[0]['pm2_env'].get('restart_time') if a else '')\"",
    "tail -n 40 /root/.pm2/logs/aantekeningen-error.log",
    "curl -sS -m 8 http://127.0.0.1:3017/api/ocr/providers",
    "curl -sS -m 8 http://127.0.0.1:3017/api/notes",
]
for c in cmds:
    print("===", c[:80])
    _, o, e = ssh.exec_command(c, timeout=30)
    print((o.read() + e.read()).decode("utf-8", "replace")[:2500])
ssh.close()
