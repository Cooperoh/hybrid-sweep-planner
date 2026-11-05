"""校验网页任务接口、输入错误和进程取消。"""

import json
import threading
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from planner.web_server import create_server


class WebServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server, cls.manager = create_server(port=0)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.manager.close()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self, path, data=None, method=None):
        body = None if data is None else json.dumps(data).encode("utf-8")
        request = Request(
            self.base_url + path,
            body,
            {"Content-Type": "application/json"},
            method=method,
        )
        try:
            response = urlopen(request, timeout=20)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.loads(response.read())

    def test_presets_and_missing_job(self):
        status, health = self.request("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(health["planner"], "HybridSweepPlanner")
        status, presets = self.request("/api/presets")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(presets["presets"]), 3)
        status, _ = self.request("/api/jobs/does-not-exist")
        self.assertEqual(status, 404)

    def test_invalid_scene_has_user_facing_error(self):
        status, response = self.request("/api/plan", {"scene": []})
        self.assertEqual(status, 400)
        self.assertTrue(response["error"]["message"])

    def test_completed_job_returns_real_planner_result(self):
        _, scene = self.request("/api/default-scene")
        scene["obstacles"] = []
        scene["world"] = {"min": -100, "max": 500}
        scene["sweep"].update(center=[200, 200], size=40, spacing=20, altitude=2000)
        scene["defaults"].update(speed=20, min_turn_radius=10, obstacle_margin=1)
        scene["sampling"].update(sample_step=1)
        scene["aircraft"] = [scene["aircraft"][0]]
        scene["aircraft"][0].update(x=0, y=0, heading_deg=45, altitude=2000)
        scene["aircraft"][0]["overrides"] = {}
        status, job = self.request("/api/plan", {"scene": scene})
        self.assertEqual(status, 202)
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            _, state = self.request(f"/api/jobs/{job['job_id']}")
            if state["status"] != "running":
                break
            time.sleep(0.03)
        self.assertEqual(state["status"], "completed", state)
        result = state["result"]
        self.assertEqual(result["aircraft"][0]["status"], "success", result)
        self.assertGreater(result["aircraft"][0]["stats"]["path_length_m"], 0)
        self.assertTrue(result["aircraft"][0]["motions"])
        self.assertEqual(result["scene"]["sweep"]["center"], [200, 200])

    def test_cancel_stops_worker(self):
        _, scene = self.request("/api/default-scene")
        _, job = self.request("/api/plan", {"scene": scene})
        status, cancelled = self.request(f"/api/jobs/{job['job_id']}", method="DELETE")
        self.assertEqual(status, 200)
        self.assertEqual(cancelled["status"], "cancelled")
        _, state = self.request(f"/api/jobs/{job['job_id']}")
        self.assertEqual(state["status"], "cancelled")
        self.assertFalse(self.manager.jobs[job["job_id"]].process.is_alive())


if __name__ == "__main__":
    unittest.main()
