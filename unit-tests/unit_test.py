# -*- coding: utf-8 -*-

__copyright__ = 'Copyright (c) 2019-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from unittest import makeSuite, TestSuite

from test_util import UtilTest


def suite() -> TestSuite:
    test_suite = TestSuite()
    test_suite.addTest(makeSuite(UtilTest))
    return test_suite
