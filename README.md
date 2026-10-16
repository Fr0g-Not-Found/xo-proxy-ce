# XO Proxy CE container

Runs the Xen Orchestra backup proxy from source in a Docker container. It follows the Community Edition proxy approach used by [XenOrchestraInstallerUpdater](https://github.com/ronivay/XenOrchestraInstallerUpdater): build the public proxy source, override its XOA appliance-license lookup when present, and import the generated proxy record into XOCE.

The image is rebuilt weekly and published as:

```text
ghcr.io/fr0g-not-found/xo-proxy-ce:latest
```

## Configure

Edit these values in `compose.yml`:

```yaml
environment:
  XO_PROXY_PORT: "443"
  XO_PROXY_NAME: "My Proxy"
  XO_PROXY_ADDRESS: "proxy.example.test:443"
```

`XO_PROXY_ADDRESS` must be a `host:port` address the XOCE server can reach. Do not include `http://`, `https://`, or a path. If the host port mapping is changed, use that published port.

Set three host paths under `volumes`: two persistent proxy directories and the
backup repository that the proxy should access directly. Replace `POOL` with
the storage-pool name on the Docker host.

```yaml
volumes:
  - /mnt/POOL/docker/xo-proxy/config:/etc/xo-proxy
  - /mnt/POOL/docker/xo-proxy/data:/var/lib/xo-proxy
  - /mnt/POOL/xo-backups:/backups
```

The first two mounts preserve the proxy identity, token, certificate, and
state. The third exposes the host's backup dataset inside the proxy as
`/backups`. Xen Orchestra remote paths must use the container path, such as
`/backups/xo`, rather than the host path beginning with `/mnt/POOL`.

## Start

```sh
docker compose up -d
docker logs xo-proxy
```

The first start creates persistent configuration, a self-signed certificate, an authentication token, and an XOCE registration file in the mounted configuration directory.

## Import into XOCE

Copy `registration.json` from the host configuration directory. In XOCE, open **Settings > Config**, choose the configuration import option, and import that JSON file.

This partial import adds the proxy record. It does not replace the rest of the XOCE configuration. Export a current XOCE configuration backup before importing it.

The generated files can also be inspected from the container:

```sh
docker exec xo-proxy cat /etc/xo-proxy/registration.json
docker exec xo-proxy cat /etc/xo-proxy/config.toml
```

`registration.json` contains the proxy authentication token. Treat it as a password and never commit it.

## Update

Pull and recreate the container. The mounted configuration and data directories preserve its identity, token, certificate, and state.

```sh
docker compose pull
docker compose up -d
```

Every build pulls the latest upstream base image. On older upstream versions, a
small module wrapper overrides only `getSelfLicense()`; the original module and
all other behavior remain intact. Changes inside that method do not require an
update to this wrapper.

Newer upstream versions have removed the proxy-side license check. When both the
method and its references are absent, the build leaves upstream untouched. It
fails if the appliance export changes shape, the hook stops being a method, or
references remain after the method disappears. These checks catch known interface
incompatibilities; they cannot guarantee compatibility with every future upstream
behavior change.

Run the compatibility tests with `node --test test/*.test.mjs`.

## License

The Xen Orchestra proxy and the modification applied to it are distributed under AGPL-3.0-or-later. See the [upstream license information](https://docs.xen-orchestra.com/licenses). The remaining original container wrapper files use the included MIT license.

This is an independent community build and is not supported by Vates or the Ezka77 project.
