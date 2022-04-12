#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
import traceback


def log_error(message: str, print_exception: bool = False) -> None:
    """Writes an error message, and optionally an exception trace to the
       web server error log.

       :param message:         Error message to print
       :param print_exception: Boolean, whether to print an exception trace
    """
    print(message, file=sys.stderr)
    if print_exception:
        traceback.print_exc()
