# XO Proxy CE container

Runs the Xen Orchestra backup proxy from source in a Docker container. It follows the Community Edition proxy approach used by [XenOrchestraInstallerUpdater](https://github.com/ronivay/XenOrchestraInstallerUpdater): build the public proxy source, disable its XOA appliance-license lookup, and import the generated proxy record into XOCE.

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

Add any host storage required by backup jobs as bind mounts under `volumes`.

## Start

```sh
docker compose up -d
docker logs xo-proxy
```

The first start creates persistent configuration, a self-signed certificate, an authentication token, and an XOCE registration file in the mounted `./config` directory.

## Import into XOCE

Copy `config/registration.json` from the Docker host. In XOCE, open **Settings > Config**, choose the configuration import option, and import that JSON file.

This partial import adds the proxy record. It does not replace the rest of the XOCE configuration. Export a current XOCE configuration backup before importing it.

The generated files can also be inspected from the container:

```sh
docker exec xo-proxy cat /etc/xo-proxy/registration.json
docker exec xo-proxy cat /etc/xo-proxy/config.toml
```

`registration.json` contains the proxy authentication token. Treat it as a password and never commit it.

## Update

Pull and recreate the container. The mounted `./config` and `./data` directories preserve its identity, token, certificate, and state.

```sh
docker compose pull
docker compose up -d
```

The build intentionally fails if upstream changes the patched license function, forcing the patch to be reviewed before a new image is published.

## License

The Xen Orchestra proxy and the modification applied to it are distributed under AGPL-3.0-or-later. See the [upstream license information](https://docs.xen-orchestra.com/licenses). The remaining original container wrapper files use the included MIT license.

This is an independent community build and is not supported by Vates or the Ezka77 project.
