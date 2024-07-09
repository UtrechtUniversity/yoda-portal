#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
import traceback
from os import name, path
from re import compile, fullmatch
from typing import List, Optional, Tuple

from werkzeug.security import safe_join
from werkzeug.utils import secure_filename


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


def unicode_secure_filename(filename: str) -> str:
    """
    Secure filename handling
    Based on werkzeug secure_filename but allows unicode characters

    :param filename: Filename of file to check

    :returns: Filename with bad characters removed
    """
    # Blacklist of characters to strip
    # No control characters, no delete, no slashes. Otherwise all other characters ok
    remove_chars_re = compile('[\u0000-\u001F\u007F\\\/]')
    # From werkzeug
    windows_device_files = {
        "CON",
        "PRN",
        "AUX",
        "NUL",
        *(f"COM{i}" for i in range(10)),
        *(f"LPT{i}" for i in range(10)),
    }

    filename = str(remove_chars_re.sub('', filename))
    for sep in path.sep, path.altsep:
        if sep:
            filename = filename.replace(sep, '')

    # on nt a couple of special files are present in each folder.  We
    # have to ensure that the target file is not such a filename.  In
    # this case we prepend an underline
    if name == 'nt' and filename and \
       filename.split('.')[0].upper() in windows_device_files:
        filename = '_' + filename

    # Last pass for a file trying to simply go up a level with ..
    if filename == '..':
        return ''

    return filename


def get_validated_static_path(
    full_path: str, request_path: str, yoda_theme_path: str, yoda_theme: str
) -> Optional[Tuple[str, str]]:
    """
    Static files handling - recognisable through '/assets/'
    Confirms that input path is valid and return corresponding static path

    :param full_path: Full path of request
    :param request_path: Short path of request
    :param yoda_theme_path: Path to the yoda themes
    :param yoda_theme: Name of the chosen theme

    :returns: Tuple of static directory and filename for correct path, None for incorrect path
    """
    # Only allow printable ascii
    if fullmatch("[ -~]*", full_path) is not None and "/assets/" in full_path:
        user_static_area = path.join(yoda_theme_path, yoda_theme)
        parts = full_path.split("/")

        # Trim empty string and file name from path
        parts = parts[1:-1]
        _, asset_name = path.split(request_path)
        # Make sure asset_name is safe
        if asset_name != secure_filename(asset_name):
            return None

        if parts[0] == "assets":
            # Main assets
            static_dir = safe_join(user_static_area + "/static", *parts[1:])
            if not static_dir:
                return None
            user_static_filename = path.join(static_dir, asset_name)
            if not path.exists(user_static_filename):
                static_dir = safe_join("/var/www/yoda/static", *parts[1:])
        else:
            # Module specific assets
            module = parts[0]
            # Make sure module name is safe
            if module != secure_filename(module):
                return None

            module_static_area = path.join(module, "static", module)
            user_static_filename = safe_join(
                path.join(user_static_area, module_static_area), *parts[2:], asset_name
            )
            if not user_static_filename:
                return None

            if path.exists(user_static_filename):
                static_dir = path.join(user_static_area, module_static_area, *parts[2:])
            else:
                static_dir = path.join("/var/www/yoda/", module_static_area, *parts[2:])

        full_path = path.join(static_dir, asset_name)
        # Check that path is correct
        if path.exists(full_path):
            return static_dir, asset_name
