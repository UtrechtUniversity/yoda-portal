# -*- coding: utf-8 -*-
"""Integration tests for the monitoring thread."""

__copyright__ = 'Copyright (c) 2023-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
from unittest import TestCase

sys.path.append("..")

from monitor import Monitor


class MonitorTest(TestCase):
    def test_can_get_tshoot_info(self) -> None:
        config = {"YODA_VERSION": "test_version"}
        monitor = Monitor(config)
        tshoot_info = monitor.get_tshoot_info().getvalue()
        self.assertIn("test_version", tshoot_info)
        self.assertIn("Thread ID", tshoot_info)
