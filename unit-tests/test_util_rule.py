"""Unit tests for helper functions used to execute API rules."""

__copyright__ = 'Copyright (c) 2026, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import sys
from unittest import TestCase

from irods.message import BinBytesBuf

sys.path.append("..")

from util import bytesbuf_to_bytes, nrep_string_expr


class UtilRuleTest(TestCase):
    def test_bytesbuf_to_bytes(self) -> None:
        # Plain buffer.
        self.assertEqual(bytesbuf_to_bytes(BinBytesBuf(buflen=5, buf=b'{"a":')), b'{"a":')
        # Null-terminated: everything from the first null byte is dropped.
        self.assertEqual(bytesbuf_to_bytes(BinBytesBuf(buflen=6, buf=b'{}\x00xyz')), b'{}')
        # Only the first buflen bytes count.
        self.assertEqual(bytesbuf_to_bytes(BinBytesBuf(buflen=2, buf=b'{}garbage')), b'{}')
        # Empty buffer.
        self.assertEqual(bytesbuf_to_bytes(BinBytesBuf(buflen=0, buf=b'')), b'')

    def test_nrep_string_expr_format(self) -> None:
        # Literals of at most m characters, joined with ++. Non-empty input always
        # ends with an extra empty literal, which does not change the value.
        self.assertEqual(nrep_string_expr("abcdef", 4), '"abcd"++\n"ef"++\n""')
        self.assertEqual(nrep_string_expr("abcd", 4), '"abcd"++\n""')
        self.assertEqual(nrep_string_expr("", 4), '""')
        # Quotes and backslashes are escaped.
        self.assertEqual(nrep_string_expr('a"b\\c'), '"a\\"b\\\\c"++\n""')

    def test_nrep_string_expr_round_trip(self) -> None:
        # Base64 input (as sent by the API) has no quotes or backslashes, so the
        # expression is simply quoted literals separated by ++ and a newline.
        for s in ["a" * 64, "a" * 65, "A+/=" * 1000]:
            literals = nrep_string_expr(s).split("++\n")
            self.assertTrue(all(lit.startswith('"') and lit.endswith('"') for lit in literals))
            pieces = [lit[1:-1] for lit in literals]
            self.assertEqual("".join(pieces), s)
            self.assertTrue(all(len(piece) <= 64 for piece in pieces))
