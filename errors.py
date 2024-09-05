#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'


class YodaError(Exception):
    pass


class UnauthorizedAPIAccessError(YodaError):
    pass


class InvalidAPIError(YodaError):
    pass


class MissingDataError(YodaError):
    pass
