#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
import traceback


def log_error(message, print_exception=False):
    """Writes an error message, and optionally an exception trace to the
       web server error log.
       :param message: error message to print
       :param print_exception: boolean, whether to print an exception trace
    """
    print(message, file=sys.stderr)
    if print_exception:
        traceback.print_exc()
