import hashlib
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("check_image", Path(__file__).with_name("check-image.py"))
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def encoded(value):
    raw = json.dumps(value).encode()
    return raw, "sha256:" + hashlib.sha256(raw).hexdigest()


class CheckImageTests(unittest.TestCase):
    def fixture(self, arch="amd64", index=True):
        config, config_digest = encoded({"os": "linux", "architecture": arch})
        manifest, manifest_digest = encoded({"config": {"digest": config_digest}})
        top, top_digest = encoded({"manifests": [
            {"digest": "sha256:" + "0" * 64, "platform": {"os": "unknown", "architecture": "unknown"}},
            {"digest": manifest_digest, "platform": {"os": "linux", "architecture": arch}},
        ]}) if index else (manifest, manifest_digest)
        responses = {"/manifests/latest": top, "/manifests/" + manifest_digest: manifest,
                     "/blobs/" + config_digest: config}
        return responses, top_digest, manifest_digest

    def test_preserves_index_digest_and_ignores_attestation(self):
        responses, top_digest, manifest_digest = self.fixture()
        with patch.object(checker, "request", side_effect=lambda url, headers: responses[url.removeprefix("https://ghcr.io/v2/owner/app")]):
            result = checker.check("ghcr.io/owner/app:latest")
        self.assertEqual(result["digest"], top_digest)
        self.assertEqual(result["manifest_digest"], manifest_digest)

    def test_arm_only_index_is_rejected(self):
        responses, _, _ = self.fixture("arm64")
        with patch.object(checker, "request", side_effect=lambda url, headers: responses[url.removeprefix("https://ghcr.io/v2/owner/app")]):
            with self.assertRaisesRegex(checker.CheckError, "no runnable linux/amd64"):
                checker.check("ghcr.io/owner/app:latest")

    def test_arm_single_manifest_is_rejected_from_config(self):
        responses, _, _ = self.fixture("arm64", index=False)
        with patch.object(checker, "request", side_effect=lambda url, headers: responses[url.removeprefix("https://ghcr.io/v2/owner/app")]):
            with self.assertRaisesRegex(checker.CheckError, "config is not linux/amd64"):
                checker.check("ghcr.io/owner/app:latest")


if __name__ == "__main__":
    unittest.main()
