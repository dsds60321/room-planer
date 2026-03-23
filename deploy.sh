#!/usr/bin/env bash

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$APP_DIR/.room-planner.pid"
LOG_DIR="$APP_DIR/logs"
OUT_LOG="$LOG_DIR/app.out.log"
ERR_LOG="$LOG_DIR/app.err.log"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
SERVER_FILE="$APP_DIR/server.js"

mkdir -p "$LOG_DIR"

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
}

require_server() {
  if [[ ! -f "$SERVER_FILE" ]]; then
    echo "server.js 파일이 없습니다."
    echo "standalone 산출물 내용을 room-planner 폴더에 업로드했는지 확인하세요."
    exit 1
  fi
}

is_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi

  local pid
  pid="$(cat "$PID_FILE")"

  if [[ -z "$pid" ]]; then
    return 1
  fi

  if kill -0 "$pid" >/dev/null 2>&1; then
    return 0
  fi

  rm -f "$PID_FILE"
  return 1
}

start() {
  require_server
  load_env

  if is_running; then
    echo "room-planner 서버가 이미 실행 중입니다. PID: $(cat "$PID_FILE")"
    exit 0
  fi

  echo "room-planner 서버를 시작합니다."
  echo "PORT=${PORT:-9100}"
  nohup node "$SERVER_FILE" >>"$OUT_LOG" 2>>"$ERR_LOG" &
  echo $! >"$PID_FILE"
  sleep 1

  if is_running; then
    echo "시작 완료. PID: $(cat "$PID_FILE")"
    exit 0
  fi

  echo "서버 시작에 실패했습니다. 로그를 확인하세요."
  exit 1
}

stop() {
  if ! is_running; then
    echo "실행 중인 room-planner 서버가 없습니다."
    exit 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"
  echo "room-planner 서버를 중지합니다. PID: $pid"
  kill "$pid" >/dev/null 2>&1 || true

  for _ in {1..10}; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      sleep 1
    else
      break
    fi
  done

  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "정상 종료되지 않아 강제 종료합니다."
    kill -9 "$pid" >/dev/null 2>&1 || true
  fi

  rm -f "$PID_FILE"
  echo "중지 완료"
}

status() {
  if is_running; then
    echo "running PID=$(cat "$PID_FILE")"
  else
    echo "stopped"
  fi
}

logs() {
  touch "$OUT_LOG" "$ERR_LOG"
  tail -n 100 -f "$OUT_LOG" "$ERR_LOG"
}

restart() {
  stop
  start
}

case "${1:-start}" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    restart
    ;;
  status)
    status
    ;;
  logs)
    logs
    ;;
  *)
    echo "사용법: ./deploy.sh {start|stop|restart|status|logs}"
    exit 1
    ;;
esac
