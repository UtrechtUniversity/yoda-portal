# -*- coding: utf-8 -*-
"""Unit tests for portal utility functions.
"""

__copyright__ = 'Copyright (c) 2023, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
from unittest import TestCase

sys.path.append('..')

from util import is_email_in_domains


class UtilTest(TestCase):

    def test_is_email_in_domains(self):
        self.assertEquals(is_email_in_domains("peter", ["uu.nl"]), False)
        self.assertEquals(is_email_in_domains("peter@uu.nl", ["uu.nl"]), True)
        self.assertEquals(is_email_in_domains("peter@vu.nl", ["uu.nl"]), False)
        self.assertEquals(is_email_in_domains("peter@buu.nl", ["uu.nl"]), False)
        self.assertEquals(is_email_in_domains("peter@uu.nl", ["buu.nl"]), False)
        self.assertEquals(is_email_in_domains("peter@uu.nl", ["*.uu.nl"]), True)
        self.assertEquals(is_email_in_domains("peter@vu.nl", ["*.uu.nl"]), False)
        self.assertEquals(is_email_in_domains("peter@buu.nl", ["*.uu.nl"]), False)
        self.assertEquals(is_email_in_domains("peter@cs.uu.nl", ["*.uu.nl"]), True)
        self.assertEquals(is_email_in_domains("peter@ai.cs.uu.nl", ["*.cs.uu.nl"]), True)
        self.assertEquals(is_email_in_domains("peter@ai.hum.uu.nl", ["*.cs.uu.nl"]), False)
