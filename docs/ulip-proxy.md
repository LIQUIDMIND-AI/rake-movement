# ULIP / ICEGATE Integration — Bastion TLS Proxy Runbook

How the dashboard talks to ULIP (Unified Logistics Interface Platform) / ICEGATE,
and how to operate the dev-bastion proxy that makes it work from local dev **and**
Vercel. Written 2026-09-08.

> **Secrets are not in this file.** The ULIP credentials and the proxy password live
> in `.env.local` (local, gitignored) and in Vercel env vars. This doc only records
> non-secret infra identifiers and the how/why.

---

## Why a proxy at all

ULIP enforces an **IP allowlist**. A request from a non-whitelisted source IP is
rejected with `HTTP 412 "Access denied Please contact ULIP support!"` — before any
credential check. Local machines and Vercel functions have dynamic egress IPs, so we
route every ULIP call through a single **static, whitelisted** IP: the dev-bastion's
Elastic IP. Requesting ULIP **production** credentials also requires declaring that
stable egress IP, so the same proxy is the path to prod.

Whitelisted (staging, confirmed 2026-09-08): `15.207.31.149`, `3.108.224.49`, `13.232.98.247`.
The bastion egresses via **`15.207.31.149`**.

---

## Architecture

```
 local dev / Vercel                         dev-bastion (AWS ap-south-1)
 ┌──────────────┐   TLS :8443 (pinned)   ┌────────────────────────────────┐
 │ Next.js app  │ ─────────────────────▶ │ nginx (stream, ssl_terminate)  │
 │ lib/ulip.ts  │   proxy Basic-Auth      │        │ loopback                │
 │ undici       │   inside the TLS        │        ▼                        │
 └──────────────┘                         │ tinyproxy :3128 (auth+CONNECT) │
        ▲                                 └────────────────┬───────────────┘
        │        end-to-end client↔ULIP TLS tunnel         │ egress = 15.207.31.149
        └──────────────────────────────────────────────────┼──▶ ULIP :443
                                                            (whitelisted IP)
```

- **Hop 1 (app → bastion): TLS** via nginx `:8443`, self-signed cert **pinned** by the
  app. The proxy Basic-Auth credential travels *inside* this TLS.
- **Hop 2 (bastion → ULIP): end-to-end TLS.** The client opens an `HTTP CONNECT`
  tunnel through tinyproxy and does its own TLS handshake with ULIP; the bastion only
  pipes bytes and cannot read them.
- **tinyproxy is loopback-only in practice** — the security group never opens `:3128`,
  so only nginx reaches it.

---

## Infra reference

| Thing | Value |
|---|---|
| AWS account | `311212292744` (dev), profile `company`, region `ap-south-1` |
| Bastion instance | `i-050d0f4337eaacc9a` (`dev-bastion`, Ubuntu, SSM-managed) |
| Egress EIP | `15.207.31.149` (allocation named `dev-bastion-ulip-eip`) |
| Security group | `sg-0adc3603b302bf636` — open: `22`, `5432`, `8443`. **Keep `3128` closed.** |
| nginx | TLS `stream` front on `:8443` → `127.0.0.1:3128`. Needs `libnginx-mod-stream`. |
| nginx cert | `/etc/nginx/ulip-proxy/proxy.{crt,key}` — self-signed, SAN `IP:15.207.31.149`, 10yr |
| tinyproxy | `:3128`, Basic-Auth user `ulip`, `ConnectPort 443` (optionally domain filter) |
| Public proxy cert (repo) | `certs/ulip-proxy.crt` — safe to commit; the app pins it |

Access the box without SSH keys via SSM, e.g.:
`AWS_PROFILE=company aws ssm send-command --instance-ids i-050d0f4337eaacc9a --document-name AWS-RunShellScript --parameters 'commands=["..."]'`

---

## App integration

- `lib/ulip.ts` — server-only ULIP/ICEGATE client (`login`, `billOfEntryStatus`,
  `igmVesselInfo`, `shippingBillStatus`, `importLookup`, `ulipStatus`).
- `app/api/ulip/status` (GET) and `app/api/ulip/import-lookup` (POST) — **Node runtime**
  (`runtime = "nodejs"`; undici's `ProxyAgent` can't run on edge).
- `components/UlipLookup.tsx` — live lookup UI, wired into `app/inbound`.

### Environment variables

| Var | Local (`.env.local`) | Vercel |
|---|---|---|
| `ULIP_BASE_URL` | `https://www.ulipstaging.dpiit.gov.in` | same (prod: `https://www.ulip.dpiit.gov.in`) |
| `ULIP_USERNAME` | staging user | set literally |
| `ULIP_PASSWORD` | `<pass>` — if it contains `$digits`, **backslash required** (see gotcha) | `<pass>` — **no** backslash (dashboard stores literally) |
| `ULIP_PROXY_URL` | `https://ulip:<proxy-pass>@15.207.31.149:8443` | same |
| `ULIP_PROXY_CA` | `certs/ulip-proxy.crt` (path) or inline PEM | `certs/ulip-proxy.crt` (committed) |

Unset `ULIP_PROXY_URL` ⇒ direct connection (will `412` from any non-whitelisted host).

---

## Gotchas (hard-won)

1. **`.env` eats the `$` in the password.** Next runs `dotenv-expand`, which reads
   a `$digits` sequence (e.g. `$123`) as an undefined variable and blanks it → the app
   sends a truncated password → ULIP `401 "User credentials are not correct"`. **Quotes
   do NOT help** (verified against Next 14.2.15's loader). Only a **backslash** works:
   `ULIP_PASSWORD=<pass-before>\$123`. On Vercel, set it plainly (no backslash).
2. **Use undici's own `fetch`, not Node's global `fetch`.** A `ProxyAgent` from the
   installed `undici` package is only accepted as a `dispatcher` by that same package's
   `fetch`; mixing with Node's built-in global fetch throws `UND_ERR_INVALID_ARG`.
3. **tinyproxy + AppArmor + the domain filter.** Ubuntu's AppArmor profile denies
   reading `/etc/tinyproxy/filter`, so tinyproxy won't start *with* a `Filter` directive
   until you either (a) allow it — add `/etc/tinyproxy/filter r,` **inside the main
   profile** `/etc/apparmor.d/usr.bin.tinyproxy` (the profile does **not** include the
   `local/` override, so editing `local/` alone is a no-op), then `apparmor_parser -r`;
   or (b) drop the `Filter` directive (BasicAuth + `ConnectPort 443` only).
   Current state: filter **dropped** (option b). Re-add it before exposing `:8443` widely.
4. **Tiny box.** The bastion has ~448 MB RAM and no swap; `apt` gets OOM-killed while
   finishing pending package ops. A 1 GB `/swapfile` was added to get installs through.
5. **EIP hairpin.** The bastion cannot curl its own `15.207.31.149:8443` (SG + hairpin);
   test the internal chain via `127.0.0.1:8443 --proxy-insecure` instead.
6. **ICEGATE path is case-sensitive and zero-padded: `ICEGATE/02`, not `icegate/2`.**
   The lowercase/non-padded path (a leftover from the old Flask numbering) is rejected by
   the ULIP gateway with `403` + **empty body**. Correct form returns `200`. `lib/ulip.ts`
   builds it as `ICEGATE/${String(n).padStart(2,"0")}`. A `200` body of
   `{"response":[{"response":"ICEGATE_0N - 3rd party service is down!","responseStatus":"ERROR"}]}`
   means the path/auth are correct but ULIP's **upstream** ICEGATE is down (transient) —
   retry later. Note: the real success payload shape is still unconfirmed (upstream was
   down when wired), so `importLookup`'s `be.response.igmNo` extraction may need adjusting
   once a live `200` data response is seen.

---

## Verify

**End to end, from a whitelisted machine (raw, bypasses the app):**
```bash
curl -s -x https://ulip:<proxy-pass>@15.207.31.149:8443 \
  --proxy-cacert certs/ulip-proxy.crt \
  -X POST https://www.ulipstaging.dpiit.gov.in/ulip/v1.0.0/user/login \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"username":"<ulip-user>","password":"<ulip-pass>"}'
# expect: {"response":{"id":"<JWT>"...},"code":"200",...}
```

**Through the app:**
```bash
pnpm dev
curl -s localhost:3000/api/ulip/status   # expect {"connected":true,...,"proxied":true}
```

**Internal chain health, on the bastion (no creds):** loopback CONNECT should return
tinyproxy's `407 Basic realm="Tinyproxy"`.

Interpreting failures: `412` = source IP not whitelisted (proxy not used / wrong egress).
`401` = reached ULIP but bad credential (often the `$` gotcha). `fetch failed` = TLS/
proxy hop broken (nginx or tinyproxy down, cert/SG mismatch).

---

## Deploy to Vercel

1. Set env vars: `ULIP_BASE_URL`, `ULIP_USERNAME`, `ULIP_PASSWORD` (**no** backslash),
   `ULIP_PROXY_URL` (the `https://…:8443` one), `ULIP_PROXY_CA` (cert is committed at
   `certs/ulip-proxy.crt`).
2. Widen the SG so Vercel's dynamic egress can reach the proxy:
   `aws ec2 authorize-security-group-ingress --group-id sg-0adc3603b302bf636 --ip-permissions IpProtocol=tcp,FromPort=8443,ToPort=8443,IpRanges='[{CidrIp=0.0.0.0/0,Description="ulip tls proxy - vercel"}]'`
3. **Before** widening to `0.0.0.0/0`, re-enable the tinyproxy domain filter (gotcha #3a)
   so a leaked proxy credential can only reach `dpiit.gov.in`.

Vercel Secure Compute (dedicated static egress IP, Enterprise) is an alternative to the
bastion — whitelist that with ULIP instead — but reusing the bastion is cheaper.

---

## Security posture

- Proxy requires **Basic-Auth** (128-bit random secret) and only permits **HTTPS
  CONNECT to :443**.
- App→bastion is **TLS with a pinned cert** (no MITM); the proxy credential is never
  sent in cleartext.
- Bastion→ULIP is the client's **own end-to-end TLS** — the bastion can't read it.
- **Residual risk while the domain filter is off:** an attacker holding the proxy
  credential could CONNECT to any host:443. Mitigated by the strong secret + TLS + SG,
  but re-enable the `dpiit.gov.in` filter before wide exposure.
- Rotate the ULIP staging credential — it was committed in the (now untracked) handover
  doc and remains in git history.

---

## Durability — "is it temporary?"

Verified 2026-09-08:

- **Survives reboot: yes.** Both `tinyproxy` and `nginx` are `systemctl enable`d, so
  they come back on boot. The SG rule, EIP, and cert all persist.
- **Survives a crash: not yet.** Both services have `Restart=no`. Harden with a drop-in:
  ```bash
  AWS_PROFILE=company aws ssm send-command --instance-ids i-050d0f4337eaacc9a \
    --document-name AWS-RunShellScript --parameters 'commands=[
      "sudo mkdir -p /etc/systemd/system/tinyproxy.service.d /etc/systemd/system/nginx.service.d",
      "printf \"[Service]\\nRestart=on-failure\\nRestartSec=3\\n\" | sudo tee /etc/systemd/system/tinyproxy.service.d/restart.conf",
      "printf \"[Service]\\nRestart=on-failure\\nRestartSec=3\\n\" | sudo tee /etc/systemd/system/nginx.service.d/restart.conf",
      "sudo systemctl daemon-reload"
    ]' --query Command.CommandId --output text
  ```
- **Does not survive the bastion being stopped/terminated** — it's a shared *dev*
  bastion, so anyone stopping it takes ULIP down. For production, move the proxy to a
  small dedicated/HA instance.
- The runtime swapfile is **not** in `/etc/fstab` (won't persist a reboot). It only
  matters for `apt`, not for serving — re-add before big package installs if needed.

## Cost

**~$0 incremental.** nginx/tinyproxy/OpenSSL are free software on the **already-running**
bastion; the EIP already exists; no load balancer (on-box nginx avoids ~$16–22/mo for an
ALB/NLB); ULIP traffic is KB-scale JSON. The only ongoing cost is the bastion instance
itself. **Operational note:** if the bastion is stopped, the ULIP integration goes down
— for production, move to a small dedicated/HA instance rather than a shared dev bastion.
