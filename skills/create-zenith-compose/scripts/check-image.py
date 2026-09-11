#!/usr/bin/env python3
"""Check anonymous manifest/config access and production linux/amd64 support.

Does not download all layers or boot the image; CI must pull and boot it.
Usage: python3 check-image.py ghcr.io/owner/image:tag
"""
import hashlib
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ACCEPT = ", ".join([
    "application/vnd.oci.image.index.v1+json",
    "application/vnd.oci.image.manifest.v1+json",
    "application/vnd.docker.distribution.manifest.list.v2+json",
    "application/vnd.docker.distribution.manifest.v2+json",
])


class CheckError(Exception):
    pass


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if urllib.parse.urlsplit(newurl).scheme != "https":
            raise CheckError("Registry redirected to a non-HTTPS URL")
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if urllib.parse.urlsplit(req.full_url).netloc != urllib.parse.urlsplit(newurl).netloc:
            redirected.remove_header("Authorization")
        return redirected


def request(url, headers):
    with urllib.request.build_opener(SafeRedirect()).open(
        urllib.request.Request(url, headers=headers), timeout=20
    ) as response:
        data = response.read(8 * 1024 * 1024 + 1)
        if len(data) > 8 * 1024 * 1024:
            raise CheckError("Registry response exceeds 8 MiB")
        return data


def check(image):
    match = re.fullmatch(r"([a-zA-Z0-9.-]+(?::[0-9]+)?)/([a-z0-9._/-]+)(?::([\w.-]+)|@(sha256:[a-f0-9]{64}))", image)
    if not match:
        raise CheckError("Use an explicit registry/repository:tag or registry/repository@sha256:digest")
    registry, name, tag, pinned = match.groups()
    base = f"https://{registry}/v2/{name}"
    token = None

    def fetch(path):
        nonlocal token
        headers = {"Accept": ACCEPT}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        try:
            return request(base + path, headers)
        except urllib.error.HTTPError as error:
            if error.code != 401 or token:
                raise
            challenge = error.headers.get("WWW-Authenticate", "")
            if not challenge.lower().startswith("bearer "):
                raise CheckError("Registry does not offer anonymous Bearer authentication") from None
            fields = dict(re.findall(r'(\w+)="([^"]*)"', challenge))
            realm = fields.get("realm", "")
            parsed = urllib.parse.urlsplit(realm)
            if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password or parsed.fragment:
                raise CheckError("Registry supplied an invalid HTTPS token endpoint")
            params = urllib.parse.parse_qsl(parsed.query)
            params += [(key, fields[key]) for key in ("service", "scope") if key in fields]
            auth_url = urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(params)))
            auth = json.loads(request(auth_url, {}))
            token = auth.get("token") or auth.get("access_token")
            if not isinstance(token, str) or not token:
                raise CheckError("Anonymous token response has no token")
            headers["Authorization"] = f"Bearer {token}"
            return request(base + path, headers)

    def document(path, expected=None):
        raw = fetch(path)
        digest = "sha256:" + hashlib.sha256(raw).hexdigest()
        if expected and digest != expected:
            raise CheckError("Registry content does not match its expected digest")
        return json.loads(raw), digest

    manifest, top_digest = document("/manifests/" + (pinned or tag), pinned)
    selected_digest = top_digest
    if "manifests" in manifest:
        candidates = [item for item in manifest["manifests"]
                      if item.get("platform", {}).get("os") == "linux"
                      and item.get("platform", {}).get("architecture") == "amd64"]
        if not candidates:
            raise CheckError("Image index has no runnable linux/amd64 manifest")
        selected_digest = candidates[0]["digest"]
        if not re.fullmatch(r"sha256:[a-f0-9]{64}", selected_digest):
            raise CheckError("Unsupported image manifest digest")
        manifest, _ = document("/manifests/" + selected_digest, selected_digest)
    config_digest = manifest["config"]["digest"]
    if not re.fullmatch(r"sha256:[a-f0-9]{64}", config_digest):
        raise CheckError("Unsupported image config digest")
    config, _ = document("/blobs/" + config_digest, config_digest)
    if config.get("os") != "linux" or config.get("architecture") != "amd64":
        raise CheckError("Image config is not linux/amd64")
    return {"image": f"{registry}/{name}@{top_digest}", "digest": top_digest,
            "platform": "linux/amd64", "manifest_digest": selected_digest,
            "config_digest": config_digest,
            "verified": "anonymous manifest and config access; layers and boot not checked"}


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise CheckError("Usage: check-image.py registry/repository:tag-or-@digest")
        print(json.dumps(check(sys.argv[1]), indent=2))
    except urllib.error.HTTPError as error:
        sys.exit(f"Registry check failed: HTTP {error.code}. Check publication, reference and access; this status alone does not establish package visibility.")
    except CheckError as error:
        sys.exit(f"Registry check failed: {error}")
    except (ValueError, KeyError, TypeError, AttributeError, OSError):
        sys.exit("Registry check failed: invalid reference, unavailable endpoint, malformed content, digest mismatch, or no linux/amd64 image. Confirm the published reference and registry manifest/config.")
