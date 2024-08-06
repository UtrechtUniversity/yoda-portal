# -*- coding: utf-8 -*-
"""Unit tests for portal utility functions."""

__copyright__ = 'Copyright (c) 2023-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
from unittest import TestCase
from unittest.mock import Mock, patch

sys.path.append("..")

from util import (
    get_theme_directories,
    get_validated_static_path,
    is_email_in_domains,
    length_check,
    unicode_secure_filename,
)


class UtilTest(TestCase):
    def test_is_email_in_domains(self) -> None:
        self.assertEqual(is_email_in_domains("peter", ["uu.nl"]), False)
        self.assertEqual(is_email_in_domains("peter@uu.nl", ["uu.nl"]), True)
        self.assertEqual(is_email_in_domains("peter@vu.nl", ["uu.nl"]), False)
        self.assertEqual(is_email_in_domains("peter@buu.nl", ["uu.nl"]), False)
        self.assertEqual(is_email_in_domains("peter@uu.nl", ["buu.nl"]), False)
        self.assertEqual(is_email_in_domains("peter@uu.nl", ["*.uu.nl"]), True)
        self.assertEqual(is_email_in_domains("peter@vu.nl", ["*.uu.nl"]), False)
        self.assertEqual(is_email_in_domains("peter@buu.nl", ["*.uu.nl"]), False)
        self.assertEqual(is_email_in_domains("peter@cs.uu.nl", ["*.uu.nl"]), True)
        self.assertEqual(is_email_in_domains("peter@ai.cs.uu.nl", ["*.cs.uu.nl"]), True)
        self.assertEqual(is_email_in_domains("peter@ai.hum.uu.nl", ["*.cs.uu.nl"]), False)

    def test_unicode_secure_filename(self) -> None:
        self.assertEqual(unicode_secure_filename('../../hi abc.txt'), '....hi abc.txt')
        self.assertEqual(unicode_secure_filename('....//hi abc.txt'), '....hi abc.txt')
        self.assertEqual(unicode_secure_filename('....\/hi abc.txt'), '....hi abc.txt')
        self.assertEqual(unicode_secure_filename('..'), '')
        self.assertEqual(unicode_secure_filename('.\\.'), '')
        self.assertEqual(unicode_secure_filename('./.'), '')
        self.assertEqual(unicode_secure_filename('.\\.'), '')
        self.assertEqual(unicode_secure_filename('.\n.'), '')
        self.assertEqual(unicode_secure_filename('.git'), '.git')
        self.assertEqual(unicode_secure_filename('._Windows'), '._Windows')
        self.assertEqual(unicode_secure_filename('__Windows__'), '__Windows__')
        self.assertEqual(unicode_secure_filename('..hi abc.txt'), '..hi abc.txt')
        self.assertEqual(unicode_secure_filename('ö.txt'), 'ö.txt')
        self.assertEqual(unicode_secure_filename('我.txt'), '我.txt')
        self.assertEqual(unicode_secure_filename('"Quote"\'Quote\'.txt'), '"Quote"\'Quote\'.txt')
        self.assertEqual(unicode_secure_filename('\nnonsense\n.txt'), 'nonsense.txt')
        self.assertEqual(unicode_secure_filename('nonsense\r\nfile'), 'nonsensefile')
        self.assertEqual(unicode_secure_filename('non\t\a\fsense\r\nfile'), 'nonsensefile')
        self.assertEqual(unicode_secure_filename('extra-file-extensions.png.jpg.pdf.zip'),
                         'extra-file-extensions.png.jpg.pdf.zip')
        self.assertEqual(unicode_secure_filename('/etc/passwd'), 'etcpasswd')
        # Invalid name, nothing is left
        self.assertEqual(unicode_secure_filename('\\/\r'), '')
        # Some of the first non printable characters
        self.assertEqual(unicode_secure_filename('\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009'
                                                 '\u000A\u000B\u000C\u000D\u000E\u000F'), '')
        self.assertEqual(unicode_secure_filename('\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019'
                                                 '\u001A\u001B\u001C\u001D\u001E\u001F\u007F'), '')

    def exists_return_value(self, pathname: str) -> bool:
        """ Mock path.exists function. True if path does not contain "theme" and "uu" """
        return not ("theme" in pathname and "uu" in pathname)

    @patch("os.path.exists")
    def test_static_loader_valid_path(self, mock_exists: Mock) -> None:
        mock_exists.side_effect = self.exists_return_value
        # uu theme
        static_dir, asset_name = get_validated_static_path(
            "/assets/img/logo.svg?wekr",
            "/assets/img/logo.svg",
            "/var/www/yoda/themes",
            "uu",
        )
        self.assertEqual(static_dir, "/var/www/yoda/static/img")
        self.assertEqual(asset_name, "logo.svg")
        # other theme
        static_dir, asset_name = get_validated_static_path(
            "/assets/img/logo.svg?wekr",
            "/assets/img/logo.svg",
            "/var/www/yoda/themes",
            "wur",
        )
        self.assertEqual(static_dir, "/var/www/yoda/themes/wur/static/img")
        self.assertEqual(asset_name, "logo.svg")

    @patch("os.path.exists")
    def test_static_loader_invalid_path(self, mock_exists: Mock) -> None:
        mock_exists.side_effect = self.exists_return_value
        # Too short
        self.assertEqual(
            get_validated_static_path(
                "/?sawerw", "/", "/var/www/yoda/themes", "uu"
            ),
            ("", "")
        )
        # Path traversal attack
        self.assertEqual(
            get_validated_static_path(
                "/assets/../../../../etc/passwd?werwrwr",
                "/assets/../../../../etc/passwd",
                "/var/www/yoda/themes",
                "uu",
            ),
            ("", "")
        )
        # non-printable characters
        full_path = "/assets/" + chr(13) + "img/logo.svg?werwer"
        path = "/assets/" + chr(13) + "img/logo.svg"
        self.assertEqual(
            get_validated_static_path(
                full_path, path, "/var/www/yoda/themes", "uu"
            ),
            ("", "")
        )
        self.assertEqual(
            get_validated_static_path(
                full_path, path, "/var/www/yoda/themes", "wur"
            ),
            ("", "")
        )
        # non-printable characters in asset name
        full_path = "/assets/img/l" + chr(13) + "ogo.svg?werwer"
        path = "/assets/img/l" + chr(13) + "ogo.svg"
        self.assertEqual(
            get_validated_static_path(
                full_path, path, "/var/www/yoda/themes", "uu"
            ),
            ("", "")
        )
        self.assertEqual(
            get_validated_static_path(
                full_path, path, "/var/www/yoda/themes", "wur"
            ),
            ("", "")
        )
        # .. in file name
        self.assertEqual(
            get_validated_static_path(
                "/assets/img/lo..go.svg?sklaerw",
                "/assets/img/lo..go.svg?sklaerw",
                "/var/www/yoda/themes",
                "uu",
            ),
            ("", "")
        )

    @patch("os.path.exists")
    def test_static_loader_module_valid_path(self, mock_exists: Mock) -> None:
        mock_exists.side_effect = self.exists_return_value
        # uu theme
        static_dir, asset_name = get_validated_static_path(
            "/group_manager/assets/js/group_manager.js?wekr",
            "/group_manager/assets/js/group_manager.js",
            "/var/www/yoda/themes",
            "uu",
        )
        self.assertEqual(
            static_dir, "/var/www/yoda/group_manager/static/group_manager/js"
        )
        self.assertEqual(asset_name, "group_manager.js")
        # other theme
        static_dir, asset_name = get_validated_static_path(
            "/group_manager/assets/lib/select2-bootstrap-5-theme/select2-bootstrap-5-theme.css?wekr",
            "/group_manager/assets/lib/select2-bootstrap-5-theme/select2-bootstrap-5-theme.css",
            "/var/www/yoda/themes",
            "wur",
        )
        self.assertEqual(
            static_dir,
            "/var/www/yoda/themes/wur/group_manager/static/group_manager/lib/select2-bootstrap-5-theme",
        )
        self.assertEqual(asset_name, "select2-bootstrap-5-theme.css")

    @patch("os.path.exists")
    def test_static_loader_module_invalid_path(self, mock_exists: Mock) -> None:
        mock_exists.side_effect = self.exists_return_value
        # Invalid module name
        self.assertEqual(
            get_validated_static_path(
                "/../assets/../research/static/research/css/research.css?sklwrawe",
                "/../assets/../research/static/research/css/research.css",
                "/var/www/yoda/themes",
                "uu",
            ),
            ("", "")
        )
        # Path traversal attack
        self.assertEqual(
            get_validated_static_path(
                "/group_manager/assets/../../../../../../etc/passwd?werwrwr",
                "/group_manager/assets/../../../../../../etc/passwd",
                "/var/www/yoda/themes",
                "uu",
            ),
            ("", "")
        )

    def test_length_check_empty(self) -> None:
        """Test that an empty banner message is identified as invalid."""
        _, is_valid = length_check("")
        self.assertFalse(is_valid)

    def test_length_check_too_long(self) -> None:
        """Test that a too-long banner message is identified as invalid."""
        _, is_valid = length_check("a" * 257)  # 257 characters long
        self.assertFalse(is_valid)

    def test_length_check_valid(self) -> None:
        """Test that a valid banner message is accepted."""
        _, is_valid = length_check("Maintenance scheduled from 1 July 7:00 to 2 July 9:00.")
        self.assertTrue(is_valid)

    def test_get_theme_directories_specific_path(self) -> None:
        """Test that the specific theme path returns themes correctly"""
        with patch('util.listdir', return_value=['vu', 'wur']), \
                patch('util.path.isdir', return_value=True):
            expected_result = ['uu', 'vu', 'wur']
            result = get_theme_directories('/var/www/yoda/themes')
            assert result == expected_result

    def test_get_theme_directories_path_not_exist(self) -> None:
        """Test that non-existent path returns an empty list"""
        with patch('util.listdir', side_effect=Exception):
            result = get_theme_directories('/non/existent/path')
            assert result == []

    def test_get_theme_directories_only_files(self) -> None:
        """Test that only files or no directory exists, returns the default uu theme"""
        with patch('util.listdir', return_value=['vu.txt', 'wur.doc']), \
                patch('util.path.isdir', return_value=False):
            expected_result = ['uu']
            result = get_theme_directories('/test/path')
            assert result == expected_result
