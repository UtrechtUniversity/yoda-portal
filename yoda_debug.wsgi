#!/usr/bin/env python3

import os
import sys

sys.path = [os.path.dirname(__file__)] + sys.path

from app import app
from werkzeug.debug import DebuggedApplication
application = DebuggedApplication(app, True)
