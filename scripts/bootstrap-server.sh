#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "$0")" && pwd)/common.sh"

PACKAGE_MANAGER=""
SUDO=""

pick_package_manager() {
  if command_exists apt-get; then
    PACKAGE_MANAGER="apt-get"
    return
  fi

  if command_exists dnf; then
    PACKAGE_MANAGER="dnf"
    return
  fi

  if command_exists yum; then
    PACKAGE_MANAGER="yum"
    return
  fi

  echo "Unsupported Linux distribution. Install python3 and Node.js 20 manually."
  exit 1
}

setup_privileges() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    SUDO=""
    return
  fi

  if command_exists sudo; then
    SUDO="sudo"
    return
  fi

  echo "This script needs root privileges. Re-run it as root or install sudo."
  exit 1
}

pkg_update() {
  case "$PACKAGE_MANAGER" in
    apt-get)
      $SUDO apt-get update
      ;;
    dnf)
      $SUDO dnf makecache
      ;;
    yum)
      $SUDO yum makecache
      ;;
  esac
}

pkg_install() {
  case "$PACKAGE_MANAGER" in
    apt-get)
      $SUDO apt-get install -y "$@"
      ;;
    dnf)
      $SUDO dnf install -y "$@"
      ;;
    yum)
      $SUDO yum install -y "$@"
      ;;
  esac
}

ensure_python() {
  if command_exists python3; then
    echo "python3 is already installed: $(python3 --version 2>/dev/null)"
    return
  fi

  echo "Installing python3"
  case "$PACKAGE_MANAGER" in
    apt-get)
      pkg_install python3 python3-venv python3-pip
      ;;
    dnf)
      pkg_install python3 python3-pip
      ;;
    yum)
      pkg_install python3 python3-pip
      ;;
  esac
}

node_version_ok() {
  if ! command_exists node || ! command_exists npm; then
    return 1
  fi

  local major
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  [[ "$major" -ge 20 ]]
}

install_nodesource_node() {
  echo "Installing Node.js 20"

  case "$PACKAGE_MANAGER" in
    apt-get)
      pkg_install ca-certificates curl gnupg
      if [[ -n "$SUDO" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
      else
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      fi
      pkg_install nodejs
      ;;
    dnf)
      pkg_install ca-certificates curl
      if [[ -n "$SUDO" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
      else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      fi
      pkg_install nodejs
      ;;
    yum)
      pkg_install ca-certificates curl
      if [[ -n "$SUDO" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
      else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      fi
      pkg_install nodejs
      ;;
  esac
}

pick_package_manager
setup_privileges
pkg_update

if ! command_exists curl; then
  pkg_install curl
fi

ensure_python

if node_version_ok; then
  echo "Node.js is already installed: $(node --version)"
else
  install_nodesource_node
fi

echo "Server bootstrap completed."
echo "python3: $(python3 --version 2>/dev/null)"
echo "node: $(node --version 2>/dev/null)"
echo "npm: $(npm --version 2>/dev/null)"
