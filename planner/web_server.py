"""提供本地网页、独立规划任务和可取消的进度接口。"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import multiprocessing
from pathlib import Path
import threading
import uuid
from urllib.parse import urlparse
import webbrowser

if __package__:
    from .mission_service import (
        default_scene,
        map_planning_error,
        normalize_scene,
        plan_scene,
        scene_presets,
    )
else:
    from mission_service import (
        default_scene,
        map_planning_error,
        normalize_scene,
        plan_scene,
        scene_presets,
    )


ROOT = Path(__file__).resolve().parent.parent
MAX_BODY_BYTES = 4 * 1024 * 1024


def _planning_worker(scene, connection):
    try:

        def progress(event):
            connection.send(("progress", event))

        result = plan_scene(scene, progress=progress)
        connection.send(("result", result))
    except Exception as exc:
        connection.send(("error", map_planning_error(exc, "任务配置")))
    finally:
        connection.close()


@dataclass
class PlanningJob:
    id: str
    process: object
    connection: object
    progress: dict
    status: str = "running"
    result: dict | None = None
    error: dict | None = None


class JobManager:
    def __init__(self):
        self.jobs = {}
        self.lock = threading.RLock()
        self.context = multiprocessing.get_context("spawn")

    def _drain(self, job):
        if job.status != "running":
            return
        try:
            while job.connection.poll():
                kind, data = job.connection.recv()
                if kind == "progress":
                    job.progress = data
                elif kind == "result":
                    job.result = data
                    job.status = "completed"
                elif kind == "error":
                    job.error = data
                    job.status = "failed"
        except (EOFError, OSError):
            pass
        if job.status == "running" and not job.process.is_alive():
            job.status = "failed"
            job.error = {
                "code": "worker_failed",
                "message": "规划进程意外结束，请重新规划。",
                "stage": "任务执行",
                "details": "",
            }
        if job.status != "running":
            job.process.join(timeout=0.1)
            job.connection.close()

    def submit(self, scene):
        with self.lock:
            for existing in self.jobs.values():
                self._drain(existing)
            if sum(job.status == "running" for job in self.jobs.values()) >= 2:
                raise RuntimeError("已有两个规划任务正在运行，请稍后重试或取消原任务。")
            completed = [
                key for key, job in self.jobs.items() if job.status != "running"
            ]
            for key in completed[:-12]:
                del self.jobs[key]
            job_id = uuid.uuid4().hex
            receiver, sender = self.context.Pipe(duplex=False)
            process = self.context.Process(
                target=_planning_worker,
                args=(scene, sender),
                name=f"HybridSweep-{job_id[:8]}",
                daemon=True,
            )
            job = PlanningJob(
                job_id,
                process,
                receiver,
                {"completed": 0, "total": len(scene["aircraft"]), "stage": "准备规划"},
            )
            process.start()
            sender.close()
            self.jobs[job_id] = job
            return {"job_id": job_id, "status": "running"}

    def get(self, job_id):
        with self.lock:
            job = self.jobs.get(job_id)
            if job is None:
                return None
            self._drain(job)
            response = {
                "job_id": job.id,
                "status": job.status,
                "progress": job.progress,
            }
            if job.result is not None:
                response["result"] = job.result
            if job.error is not None:
                response["error"] = job.error
            return response

    def cancel(self, job_id):
        with self.lock:
            job = self.jobs.get(job_id)
            if job is None:
                return None
            self._drain(job)
            if job.status == "running":
                job.status = "cancelled"
                job.process.terminate()
                job.process.join(timeout=2)
                job.connection.close()
            return {"job_id": job.id, "status": job.status}

    def close(self):
        with self.lock:
            for job_id in list(self.jobs):
                self.cancel(job_id)


class PlannerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, manager, directory, **kwargs):
        self.manager = manager
        super().__init__(*args, directory=str(directory), **kwargs)

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/default-scene":
            self._json(default_scene())
        elif path == "/api/presets":
            self._json({"presets": scene_presets()})
        elif path == "/api/health":
            self._json({"status": "ok", "planner": "HybridSweepPlanner"})
        elif path.startswith("/api/jobs/"):
            job = self.manager.get(path.rsplit("/", 1)[-1])
            self._json(
                job if job else {"error": {"message": "规划任务不存在或已过期。"}},
                200 if job else 404,
            )
        elif path.startswith("/api/"):
            self._json({"error": {"message": "接口不存在。"}}, 404)
        elif path == "/" and not (Path(self.directory) / "index.html").is_file():
            self._json({"error": {"message": "网页尚未构建，请先运行启动脚本。"}}, 503)
        else:
            super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api/plan":
            self._json({"error": {"message": "接口不存在。"}}, 404)
            return
        try:
            if "application/json" not in self.headers.get("Content-Type", ""):
                raise ValueError("请以JSON格式提交场景。")
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_BODY_BYTES:
                raise ValueError("场景内容为空或超过4MB。")
            body = json.loads(self.rfile.read(length))
            if not isinstance(body, dict) or "scene" not in body:
                raise ValueError("请求中缺少场景配置。")
            scene = normalize_scene(body["scene"])
            self._json(self.manager.submit(scene), 202)
        except (ValueError, TypeError, KeyError, OverflowError) as exc:
            self._json({"error": map_planning_error(exc, "任务配置")}, 400)
        except RuntimeError as exc:
            self._json(
                {"error": {"code": "busy", "message": str(exc), "stage": "任务执行"}},
                409,
            )

    def do_DELETE(self):
        path = urlparse(self.path).path
        if not path.startswith("/api/jobs/"):
            self._json({"error": {"message": "接口不存在。"}}, 404)
            return
        result = self.manager.cancel(path.rsplit("/", 1)[-1])
        self._json(
            result if result else {"error": {"message": "规划任务不存在或已过期。"}},
            200 if result else 404,
        )

    def log_message(self, format, *args):
        if args and str(args[1]) not in {"200", "202", "304"}:
            super().log_message(format, *args)


def create_server(host="127.0.0.1", port=8765):
    manager = JobManager()
    handler = partial(PlannerHandler, manager=manager, directory=ROOT / "web" / "dist")
    server = ThreadingHTTPServer((host, port), handler)
    server.daemon_threads = True
    return server, manager


def main():
    parser = argparse.ArgumentParser(description="HybridSweepPlanner 本地网页工作台")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8765, type=int)
    parser.add_argument("--open", action="store_true", help="启动后打开浏览器")
    args = parser.parse_args()
    server, manager = create_server(args.host, args.port)
    url = f"http://{args.host}:{server.server_port}"
    print(f"HybridSweepPlanner 工作台：{url}", flush=True)
    if args.open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        pass
    finally:
        manager.close()
        server.server_close()


if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
