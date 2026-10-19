#!/usr/bin/env bash
# install_loader.sh
# Installs fx-autoconfig program loader files into /usr/lib/firefox

set -euo pipefail

FIREFOX_DIR="/usr/lib/firefox"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROGRAM_DIR="${SCRIPT_DIR}/fx-autoconfig-program"

echo "[INFO] Target Firefox directory: ${FIREFOX_DIR}"

if [[ ! -d "${FIREFOX_DIR}" ]]; then
  echo "[FAIL] Firefox directory ${FIREFOX_DIR} not found."
  exit 1
fi

echo "[INFO] Installing config.js..."
sudo cp "${PROGRAM_DIR}/config.js" "${FIREFOX_DIR}/config.js"

echo "[INFO] Installing defaults/pref/config-prefs.js..."
sudo mkdir -p "${FIREFOX_DIR}/defaults/pref"
sudo cp "${PROGRAM_DIR}/defaults/pref/config-prefs.js" "${FIREFOX_DIR}/defaults/pref/config-prefs.js"

echo "[PASS] fx-autoconfig loader successfully installed into ${FIREFOX_DIR}!"
echo "[INFO] Next: Restart Firefox to load unload_tab_group.uc.js."
