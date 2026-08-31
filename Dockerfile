ARG BASE_IMAGE=ezka77/xen-orchestra-ce:latest
FROM ${BASE_IMAGE}

LABEL org.opencontainers.image.title="XO Proxy CE container"
LABEL org.opencontainers.image.description="Container wrapper for the upstream Xen Orchestra proxy built from source"
LABEL org.opencontainers.image.source="https://github.com/Fr0g-Not-Found/xo-proxy-ce"

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/xo-proxy-entrypoint

RUN mkdir -p /etc/xo-proxy /var/lib/xo-proxy/data /run/xo-proxy/mounts

ENV XO_PROXY_PORT=443 \
    XO_PROXY_CONFIG=/etc/xo-proxy/config.toml \
    XO_PROXY_DATA_DIR=/var/lib/xo-proxy/data \
    XO_PROXY_MOUNTS_DIR=/run/xo-proxy/mounts

EXPOSE 443
VOLUME ["/etc/xo-proxy", "/var/lib/xo-proxy"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD nc -z 127.0.0.1 "${XO_PROXY_PORT}" || exit 1

ENTRYPOINT ["/usr/local/bin/xo-proxy-entrypoint"]
CMD ["/usr/bin/node", "/home/node/xen-orchestra/@xen-orchestra/proxy/index.mjs"]

