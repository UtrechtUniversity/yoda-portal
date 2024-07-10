"""Unit tests for portal admin functions."""

__copyright__ = 'Copyright (c) 2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
from unittest import TestCase

sys.path.append("..")

from admin.admin import length_check


class AdminTest(TestCase):
    def test_length_check_empty(self):
        """Test that an empty banner message is identified as invalid."""
        _, is_valid = length_check("")
        self.assertFalse(is_valid)

    def test_length_check_too_long(self):
        """Test that a too-long banner message is identified as invalid."""
        _, is_valid = length_check("a" * 257)  # 257 characters long
        self.assertFalse(is_valid)

    def test_length_check_valid(self):
        """Test that a valid banner message is accepted."""
        _, is_valid = length_check("Maintenance scheduled from 1 July 7:00 to 2 July 9:00.")
        self.assertTrue(is_valid)
