#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/jiangmuran/jiangmuran.git}"
GITEE_REPO_URL="${GITEE_REPO_URL:-https://gitee.com/jiangmuran/jiangmuran.git}"
EN_BRANCH="${EN_BRANCH:-website}"
ZH_BRANCH="${ZH_BRANCH:-website_zh}"
SYNC_INTERVAL="${SYNC_INTERVAL:-60}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${TARGET_DIR:-$SCRIPT_DIR}"
CACHE_ROOT="${CACHE_ROOT:-${HOME}/.cache/jiangmuran-branch-sync}"
WATCH_MODE=1

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

usage() {
  cat <<'EOF'
Usage: ./sync-zh-en-branches.sh [--watch|--once] [--interval SECONDS]

Options:
  --watch             Run continuously (default)
  --once              Run one sync cycle and exit
  --interval SECONDS  Polling interval for watch mode (default: 60)
  --help              Show this message

Env overrides:
  TARGET_ENV=zh|en    Force environment selection
  TARGET_DIR=/path    Sync target directory (default: script directory)
  REPO_URL=...        Remote repository URL (GitHub fallback)
  GITEE_REPO_URL=...  Gitee mirror URL (ZH primary, default: gitee.com/jiangmuran/jiangmuran)
  ZH_BRANCH=...       Chinese branch name (default: website_zh)
  EN_BRANCH=...       English branch name (default: website)
  SYNC_INTERVAL=...   Same as --interval
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

is_git_repo() {
  git -C "$TARGET_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1
}

detect_env() {
  if [[ -n "${TARGET_ENV:-}" ]]; then
    case "$TARGET_ENV" in
      zh|ZH|cn|CN)
        echo "zh"
        return
        ;;
      en|EN)
        echo "en"
        return
        ;;
      *)
        log "Invalid TARGET_ENV: $TARGET_ENV (expected zh/en)"
        exit 1
        ;;
    esac
  fi

  if [[ -f "$TARGET_DIR/CNAME" ]]; then
    local cname
    cname="$(tr -d '\r\n[:space:]' < "$TARGET_DIR/CNAME")"
    case "$cname" in
      en.jiangmuran.com)
        echo "en"
        return
        ;;
      jiangmuran.com|zh.jiangmuran.com|www.jiangmuran.com)
        echo "zh"
        return
        ;;
    esac
  fi

  if is_git_repo; then
    local branch
    branch="$(git -C "$TARGET_DIR" branch --show-current || true)"
    if [[ "$branch" == "$EN_BRANCH" ]]; then
      echo "en"
      return
    fi
    if [[ "$branch" == "$ZH_BRANCH" ]]; then
      echo "zh"
      return
    fi
  fi

  case "$(basename "$TARGET_DIR")" in
    *website_zh*|*zh*|*cn*)
      echo "zh"
      return
      ;;
    *website*|*en*)
      echo "en"
      return
      ;;
  esac

  log "Unable to detect environment in: $TARGET_DIR"
  log "Set TARGET_ENV=zh or TARGET_ENV=en"
  exit 1
}

branch_for_env() {
  local env="$1"
  if [[ "$env" == "zh" ]]; then
    echo "$ZH_BRANCH"
  else
    echo "$EN_BRANCH"
  fi
}

ensure_interval() {
  case "$SYNC_INTERVAL" in
    ''|*[!0-9]*)
      log "Invalid interval: $SYNC_INTERVAL"
      exit 1
      ;;
  esac

  if [[ "$SYNC_INTERVAL" -lt 1 ]]; then
    log "Interval must be >= 1 second"
    exit 1
  fi
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --watch)
        WATCH_MODE=1
        shift
        ;;
      --once)
        WATCH_MODE=0
        shift
        ;;
      --interval)
        if [[ $# -lt 2 ]]; then
          log "Missing value for --interval"
          exit 1
        fi
        SYNC_INTERVAL="$2"
        shift 2
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        log "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
  done
}

ensure_origin_remote() {
  if ! git -C "$TARGET_DIR" remote get-url origin >/dev/null 2>&1; then
    git -C "$TARGET_DIR" remote add origin "$REPO_URL"
  fi
}

# For zh env: try GitHub first, fall back to Gitee
resolve_repo_url() {
  local env="$1"
  if [[ "$env" == "zh" ]]; then
    if git ls-remote "$REPO_URL" HEAD >/dev/null 2>&1; then
      echo "$REPO_URL"
    else
      log "GitHub unreachable, falling back to Gitee"
      echo "$GITEE_REPO_URL"
    fi
  else
    echo "$REPO_URL"
  fi
}

sync_git_repo() {
  local branch="$1"
  local env="$2"
  local url
  url="$(resolve_repo_url "$env")"

  if [[ -n "$(git -C "$TARGET_DIR" status --porcelain)" ]]; then
    log "Working tree has local changes, skip sync this round."
    return 0
  fi

  if ! git -C "$TARGET_DIR" remote get-url origin >/dev/null 2>&1; then
    git -C "$TARGET_DIR" remote add origin "$url"
  else
    git -C "$TARGET_DIR" remote set-url origin "$url"
  fi

  git -C "$TARGET_DIR" fetch --quiet origin "$branch"

  if git -C "$TARGET_DIR" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$TARGET_DIR" checkout --quiet "$branch"
  else
    git -C "$TARGET_DIR" checkout --quiet -B "$branch" "origin/$branch"
  fi

  local local_sha remote_sha
  local_sha="$(git -C "$TARGET_DIR" rev-parse HEAD)"
  remote_sha="$(git -C "$TARGET_DIR" rev-parse "origin/$branch")"

  if [[ "$local_sha" == "$remote_sha" ]]; then
    log "No updates (${local_sha:0:7})"
    return 0
  fi

  git -C "$TARGET_DIR" pull --ff-only --quiet origin "$branch"
  log "Updated to $(git -C "$TARGET_DIR" rev-parse --short HEAD) [${url%%/*//*/}]"
}

state_file_for() {
  local branch="$1"
  local key
  key="$(printf '%s|%s' "$TARGET_DIR" "$branch" | tr '/:| ' '_')"
  echo "$CACHE_ROOT/state_${key}.sha"
}

sync_plain_dir() {
  local branch="$1"
  local env="$2"
  local url remote_sha cache_dir state_file cached_sha
  url="$(resolve_repo_url "$env")"

  require_cmd rsync
  mkdir -p "$CACHE_ROOT"

  remote_sha="$(git ls-remote "$url" "refs/heads/$branch" | cut -f1)"
  if [[ -z "$remote_sha" ]]; then
    log "Failed to query remote branch: $branch from $url"
    return 1
  fi

  state_file="$(state_file_for "$branch")"
  cached_sha=""
  if [[ -f "$state_file" ]]; then
    cached_sha="$(cat "$state_file")"
  fi

  if [[ "$cached_sha" == "$remote_sha" ]]; then
    log "No updates (${remote_sha:0:7})"
    return 0
  fi

  cache_dir="$CACHE_ROOT/cache_${branch}"
  if [[ ! -d "$cache_dir/.git" ]]; then
    rm -rf "$cache_dir"
    git clone --quiet --depth 1 --single-branch --branch "$branch" "$url" "$cache_dir"
  else
    # Update remote URL in case we switched between Gitee and GitHub
    git -C "$cache_dir" remote set-url origin "$url"
    git -C "$cache_dir" fetch --quiet origin "$branch"
    if git -C "$cache_dir" show-ref --verify --quiet "refs/heads/$branch"; then
      git -C "$cache_dir" checkout --quiet "$branch"
    else
      git -C "$cache_dir" checkout --quiet -B "$branch" "origin/$branch"
    fi
    git -C "$cache_dir" pull --ff-only --quiet origin "$branch"
  fi

  rsync -a --delete --exclude ".git" "$cache_dir/" "$TARGET_DIR/"
  printf '%s' "$remote_sha" > "$state_file"
  log "Mirrored latest $branch (${remote_sha:0:7}) [${url%%/*//*/}]"
}

run_cycle() {
  local env branch
  env="$(detect_env)"
  branch="$(branch_for_env "$env")"

  log "Environment: $env | Branch: $branch | Dir: $TARGET_DIR"

  if is_git_repo; then
    sync_git_repo "$branch" "$env"
  else
    sync_plain_dir "$branch" "$env"
  fi
}

main() {
  require_cmd git
  parse_args "$@"
  ensure_interval

  trap 'log "Stop signal received, exiting."; exit 0' INT TERM

  if [[ "$WATCH_MODE" -eq 0 ]]; then
    run_cycle
    log "Sync complete."
    exit 0
  fi

  log "Starting watch mode (interval ${SYNC_INTERVAL}s)"
  while true; do
    if ! run_cycle; then
      log "Sync cycle failed, will retry."
    fi
    sleep "$SYNC_INTERVAL"
  done
}

main "$@"
