#!/usr/bin/env python3

__copyright__ = "Copyright (c) 2024, Utrecht University"
__license__   = "GPLv3, see LICENSE"

from flask import abort, Blueprint, render_template, Response

import api

admin_bp = Blueprint("admin_bp", __name__,
                     template_folder="templates/admin",
                     static_folder="static/admin",
                     static_url_path="/assets")


@admin_bp.route("/")
def index() -> Response:
    """Route to the admin page, if user has admin access"""
    has_admin_access = api.call("admin_has_access", data={})["data"]

    if has_admin_access:
        return render_template("admin.html")
    else:
        return abort(403)
