# XO Proxy CE container

This project packages the upstream Xen Orchestra proxy process from [Ezka77's Xen Orchestra CE image](https://github.com/Ezka77/xen-orchestra-ce) as a standalone container.

The container:

- starts `@xen-orchestra/proxy` instead of `xo-server`;
- generates a persistent authentication token on first start;
- generates `/etc/xo-proxy/config.toml` from the container environment;
- stores its token, certificate, and data outside the image; and
- is rebuilt weekly and published as `ghcr.io/fr0g-not-found/xo-proxy-ce:latest`.

## Run it

```sh
docker compose up -d
docker logs xo-proxy
```

Read the generated token:

```sh
docker exec xo-proxy cat /etc/xo-proxy/authentication-token
```

The generated configuration is available at:

```sh
docker exec xo-proxy cat /etc/xo-proxy/config.toml
```

Register the proxy in Xen Orchestra with its reachable HTTPS address and generated authentication token. Xen Orchestra assigns the proxy ID during registration; there is no configuration file to import and no UUID to invent.

## Current limitation

This image starts and registers the open-source proxy process, but it is not currently a functional replacement for the official XO Proxy appliance. Upstream backup execution requires a valid proxy license supplied through the appliance updater service. That updater is not part of this image, so a backup job will fail rather than bypass the check.

The relevant upstream implementation is in [`backups.mjs`](https://github.com/vatesfr/xen-orchestra/blob/master/%40xen-orchestra/proxy/app/mixins/backups.mjs) and [`appliance.mjs`](https://github.com/vatesfr/xen-orchestra/blob/master/%40xen-orchestra/proxy/app/mixins/appliance.mjs).

## License

Xen Orchestra's proxy source is AGPL-3.0-or-later. See [upstream licensing](https://docs.xen-orchestra.com/licenses). The original wrapper files in this repository use the included MIT license.

This independent project is not supported by Vates or the Ezka77 project.

