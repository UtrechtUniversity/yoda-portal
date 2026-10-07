# -*- coding: utf-8 -*-

__copyright__ = 'Copyright (c) 2019-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from unittest import makeSuite, TestSuite

from test_api import ApiTest
from test_monitor import MonitorTest
from test_util import UtilTest
from test_util_rule import UtilRuleTest


def suite() -> TestSuite:
    test_suite = TestSuite()
    test_suite.addTest(makeSuite(ApiTest))
    test_suite.addTest(makeSuite(MonitorTest))
    test_suite.addTest(makeSuite(UtilTest))
    test_suite.addTest(makeSuite(UtilRuleTest))
    return test_suite
