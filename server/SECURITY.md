# LAN security model

On startup, the engine prints a random six-digit pairing code. The Android controller exchanges it for a 256-bit in-memory bearer token. Five invalid attempts trigger a one-minute lockout. Restarting the engine invalidates every session.

- Bind the engine only on trusted private networks.
- Do not port-forward TCP 8787 to the public internet.
- For remote access, use Tailscale/WireGuard and HTTPS termination.
- `DISABLE_AUTH=true` is intended only for isolated development.
- Asset paths are normalized and restricted to their owning project directory.

A future multi-user deployment should replace in-memory sessions with hashed, expiring tokens, device revocation, TLS, user accounts, and project-level authorization.
