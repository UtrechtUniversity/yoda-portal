#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
import traceback
from typing import List


def log_error(message: str, print_exception: bool = False) -> None:
    """Writes an error message, and optionally an exception trace to the
       web server error log.

       :param message:         Error message to print
       :param print_exception: Boolean, whether to print an exception trace
    """
    print(message, file=sys.stderr)
    if print_exception:
        traceback.print_exc()


def is_email_in_domains(email: str, domain_list: List[str]) -> bool:
    """Determines if an email address is in a list of domains

       :param email: email address of a user
       :param domain_list: list of domains, which can also include wildcard domains that
                           match a domain and any of its subdomains
                           (e.g. "*.uu.nl" matches both user@uu.nl, user@subdomain.uu.nl)

       :returns: boolean value that indicates whether this email address is in one of the
                 domains
    """
    for domain in domain_list:
        if domain.startswith("*."):
            if email.endswith(domain[1:]) or email.endswith("@" + domain[2:]):
                return True
        else:
            if email.endswith("@" + domain):
                return True

    return False
