# -*- coding: utf-8 -*-
"""Unit tests for portal utility functions.
"""

__copyright__ = 'Copyright (c) 2023, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
from unittest import TestCase
from unittest.mock import patch

sys.path.append('..')

from util import is_email_in_domains
from util import get_validated_static_path


class UtilTest(TestCase):

    def test_is_email_in_domains(self):
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
    
    
    # If path contains theme and uu, path does not exist
    # if path contains anything else, path does exist
    def exists_return_value(self, pathname):
        return not ('theme' in pathname and 'uu' in pathname)


    @patch('os.path.exists')
    def test_static_loader_valid_path(self, mock_exists):
        mock_exists.side_effect = self.exists_return_value
        # uu theme
        static_dir, asset_name = get_validated_static_path('/assets/img/logo.svg?wekr', '/assets/img/logo.svg', "/var/www/yoda/themes", "uu")
        self.assertEqual(static_dir, '/var/www/yoda/static/img')
        self.assertEqual(asset_name, 'logo.svg')
        # other theme
        static_dir, asset_name = get_validated_static_path('/assets/img/logo.svg?wekr', '/assets/img/logo.svg', "/var/www/yoda/themes", "wur")
        self.assertEqual(static_dir, '/var/www/yoda/themes/wur/static/img')
        self.assertEqual(asset_name, 'logo.svg')


    @patch('os.path.exists')
    def test_static_loader_invalid_path(self, mock_exists):
        mock_exists.side_effect = self.exists_return_value
        # Too short
        self.assertIsNone(get_validated_static_path("/?sawerw", "/", "/var/www/yoda/themes", "uu"))
        # Path traversal attack
        self.assertIsNone(get_validated_static_path("/assets/../../../../etc/passwd?werwrwr", "/assets/../../../../etc/passwd", "/var/www/yoda/themes", "uu"))
        # non-printable characters
        full_path = "/assets/" + chr(13) + "img/logo.svg?werwer"
        path = "/assets/" + chr(13) + "img/logo.svg"
        self.assertIsNone(get_validated_static_path(full_path, path, "/var/www/yoda/themes", "uu"))
        self.assertIsNone(get_validated_static_path(full_path, path, "/var/www/yoda/themes", "wur"))
        # non-printable characters in asset name
        full_path = "/assets/img/l" + chr(13) + "ogo.svg?werwer"
        path = "/assets/img/l" + chr(13) + "ogo.svg"
        self.assertIsNone(get_validated_static_path(full_path, path, "/var/www/yoda/themes", "uu"))
        self.assertIsNone(get_validated_static_path(full_path, path, "/var/www/yoda/themes", "wur"))
        # .. in file name
        self.assertIsNone(get_validated_static_path("/assets/img/lo..go.svg?sklaerw", "/assets/img/lo..go.svg?sklaerw", "/var/www/yoda/themes", "uu"))


    @patch('os.path.exists')
    def test_static_loader_module_valid_path(self, mock_exists):
        mock_exists.side_effect = self.exists_return_value
        # uu theme
        static_dir, asset_name = get_validated_static_path('/group_manager/assets/js/group_manager.js?wekr', '/group_manager/assets/js/group_manager.js', "/var/www/yoda/themes", "uu")
        self.assertEqual(static_dir, '/var/www/yoda/group_manager/static/group_manager/js')
        self.assertEqual(asset_name, 'group_manager.js')
        # other theme
        static_dir, asset_name = get_validated_static_path('/group_manager/assets/lib/select2-bootstrap-5-theme/select2-bootstrap-5-theme.css?wekr', '/group_manager/assets/lib/select2-bootstrap-5-theme/select2-bootstrap-5-theme.css', "/var/www/yoda/themes", "wur")
        self.assertEqual(static_dir, '/var/www/yoda/themes/wur/group_manager/static/group_manager/lib/select2-bootstrap-5-theme')
        self.assertEqual(asset_name, 'select2-bootstrap-5-theme.css')


    @patch('os.path.exists')
    def test_static_loader_module_invalid_path(self, mock_exists):
        mock_exists.side_effect = self.exists_return_value
        # Invalid module name
        self.assertIsNone(get_validated_static_path("/../assets/../research/static/research/css/research.css?sklwrawe", "/../assets/../research/static/research/css/research.css", "/var/www/yoda/themes", "uu"))
        # Path traversal attack
        self.assertIsNone(get_validated_static_path("/group_manager/assets/../../../../../../etc/passwd?werwrwr", "/group_manager/assets/../../../../../../etc/passwd", "/var/www/yoda/themes", "uu"))