# -*- coding: utf-8 -*-
"""Unit tests for single-part and multi-part API rule execution."""

__copyright__ = 'Copyright (c) 2026, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import base64
import hashlib
import os
import sys
import zlib
from contextlib import nullcontext
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import patch

import orjson

sys.path.append("..")

import api

OK_RESPONSE = b'{"status": "ok", "status_info": null, "data": null}'


def decode(encoded: str) -> bytes:
    """Reverse api._compress_parameters()."""
    return zlib.decompress(base64.b64decode(encoded))


class ApiTest(TestCase):
    def setUp(self) -> None:
        # Record every rule call as (function, decoded parameters, connection).
        self.calls: list[tuple[str, bytes, str | None]] = []

        # Fake iRODS session: the pool hands out one recognizable connection.
        pool = SimpleNamespace(get_connection=lambda: nullcontext("connection-1"))
        g_patch = patch.object(api, "g", SimpleNamespace(irods=SimpleNamespace(pool=pool)))
        g_patch.start()
        self.addCleanup(g_patch.stop)

    def fake_execute_rule(self, fn: str, encoded: str) -> bytes:
        self.calls.append((fn, decode(encoded), None))
        return OK_RESPONSE

    def fake_execute_rule_single_agent(self, fn: str, encoded: str, connection: str) -> bytes:
        self.calls.append((fn, decode(encoded), connection))
        return OK_RESPONSE

    def execute(self, params: bytes) -> bytes:
        with patch.object(api, "_execute_rule", self.fake_execute_rule), \
             patch.object(api, "_execute_rule_single_agent", self.fake_execute_rule_single_agent):
            return api.execute_rule("meta_form_save", params)

    def test_single_part_request(self) -> None:
        params = orjson.dumps({"coll": "/tempZone/home/research-test", "metadata": {"Title": "Test"}})
        self.assertEqual(self.execute(params), OK_RESPONSE)
        self.assertEqual(self.calls, [("meta_form_save", params, None)])

    def test_multi_part_request(self) -> None:
        params = orjson.dumps({"metadata": {"Description": base64.b64encode(os.urandom(40000)).decode()}})

        self.assertEqual(self.execute(params), OK_RESPONSE)

        functions = [fn for fn, _, _ in self.calls]
        submits = [orjson.loads(p)["chunk"] for fn, p, _ in self.calls if fn == "stage_multipart_request_submit"]
        run = orjson.loads(self.calls[-1][1])

        self.assertGreater(len(submits), 1)
        self.assertEqual(functions,
                         ["stage_multipart_request_clear"]
                         + ["stage_multipart_request_submit"] * len(submits)
                         + ["stage_multipart_request_run"])

        # All calls go over the same connection (i.e. to the same agent).
        self.assertEqual({conn for _, _, conn in self.calls}, {"connection-1"})

        # Each part fits in a single rule call.
        self.assertTrue(all(len(chunk) <= api.MULTIPART_MAX_CHUNK_SIZE for chunk in submits))

        # The parts reassemble into the original parameters, and run names
        # the API function and carries the matching checksum.
        self.assertEqual(decode("".join(submits)), params)
        self.assertEqual(run, {"function": "meta_form_save",
                               "checksum": hashlib.shake_256(params).hexdigest(20)})

    def test_multi_part_request_stops_on_error(self) -> None:
        params = orjson.dumps({"data": base64.b64encode(os.urandom(40000)).decode()})

        def failing_submit(fn: str, encoded: str, connection: str) -> bytes:
            self.calls.append((fn, decode(encoded), connection))
            if fn == "stage_multipart_request_submit":
                return b'{"status": "error_internal", "status_info": "Too large", "data": null}'
            return OK_RESPONSE

        with patch.object(api, "_execute_rule_single_agent", failing_submit), \
             self.assertRaises(api.MultiPartRequestException):
            api.execute_rule("meta_form_save", params)

        self.assertEqual([fn for fn, _, _ in self.calls],
                         ["stage_multipart_request_clear", "stage_multipart_request_submit"])

    def test_rule_text(self) -> None:
        text = api._rule_text("stage_multipart_request_clear", api._compress_parameters(b"{}"))

        # Wrapped like irods.rule.Rule does; a bare rule body cannot be parsed by iRODS.
        self.assertTrue(text.startswith("@external rule { "))
        self.assertTrue(text.endswith(" }"))
        self.assertIn('*x="eJyrrgUAAXUA+Q=="', text)
        self.assertIn("api_stage_multipart_request_clear(*x)", text)
