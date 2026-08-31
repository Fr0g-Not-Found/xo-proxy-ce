#!/usr/bin/env sh
set -eu

config=${XO_PROXY_CONFIG:-/etc/xo-proxy/config.toml}
token_file=${XO_PROXY_TOKEN_FILE:-/etc/xo-proxy/authentication-token}
data_dir=${XO_PROXY_DATA_DIR:-/var/lib/xo-proxy/data}
mounts_dir=${XO_PROXY_MOUNTS_DIR:-/run/xo-proxy/mounts}
port=${XO_PROXY_PORT:-443}

mkdir -p "$(dirname "$config")" "$data_dir" "$mounts_dir"

if [ ! -s "$token_file" ]; then
  umask 077
  openssl rand -hex 32 > "$token_file"
  printf '%s\n' "Generated a new proxy authentication token in $token_file"
fi

token=$(tr -d '\r\n' < "$token_file")
if [ -z "$token" ]; then
  printf '%s\n' "error: proxy token is empty: $token_file" >&2
  exit 1
fi

umask 077
cat > "$config" <<EOF
authenticationToken = '$token'
datadir = '$data_dir'
resourceCacheDelay = '5m'

[api]
keepAliveInterval = 10000

[backups]
dirMode = 448
disableMergeWorker = false
snapshotNameLabelTpl = '[XO Backup {job.name}] {vm.name_label}'
vhdDirectoryCompression = 'brotli'
maxMergedDeltasPerRun = 2

[http.listen.https]
autoCert = true
cert = '/var/lib/xo-proxy/certificate.pem'
key = '/var/lib/xo-proxy/key.pem'
port = $port

[logs]
level = 'info'

[remoteOptions]
mountsDir = '$mounts_dir'
timeout = 600000

[remotes]
disableFileRemotes = false

[xapiOptions]
maxUncoalescedVdis = 1
watchEvents = ['network', 'PIF', 'pool', 'SR', 'task', 'VBD', 'VDI', 'VIF', 'VM', 'VM_guest_metrics']
EOF
chmod 600 "$config" "$token_file"

/usr/bin/node /usr/local/lib/xo-proxy-ce/write-registration.mjs
if [ -n "${XO_PROXY_ADDRESS:-}" ]; then
  printf '%s\n' "XOCE registration file: /etc/xo-proxy/registration.json"
fi

exec "$@"
