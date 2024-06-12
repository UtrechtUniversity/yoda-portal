#!/usr/bin/env python3

__copyright__ = "Copyright (c) 2024, Utrecht University"
__license__ = "GPLv3, see LICENSE"

from flask import Blueprint, g, render_template, Response

import api

admin_bp = Blueprint(
    "admin_bp",
    __name__,
    template_folder="templates/admin",
    static_folder="static/admin",
    static_url_path="/assets",
)


@admin_bp.route("/")
def index() -> Response:
    # Call api to check is user is admin
    is_admin = api.call("admin_is_user_admin", {})
    if (
        is_admin
    ):  # TODO redirect to the access-dinied html (available) for non-admin user
        print("Test api_group_user_is_admin success, from Portal")

    return render_template("admin.html")
