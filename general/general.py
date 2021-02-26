from flask import Blueprint

general_bp = Blueprint('general_bp', __name__,
    template_folder='templates/general',
    static_folder='static/general')
