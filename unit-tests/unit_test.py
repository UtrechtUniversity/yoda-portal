# -*- coding: utf-8 -*-

__copyright__ = 'Copyright (c) 2019-2023, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from unittest import makeSuite, TestSuite

from test_admin import AdminTest
from test_util import UtilTest


def suite():
    test_suite = TestSuite()
    test_suite.addTest(makeSuite(AdminTest))
    test_suite.addTest(makeSuite(UtilTest))
    return test_suite
