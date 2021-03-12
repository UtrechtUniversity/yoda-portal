from flask import Blueprint, render_template

group_bp = Blueprint('group_bp', __name__,
    template_folder='templates/group_manager',
    static_folder='static/group_manager')


@group_bp.route('/example')
def index():
    return render_template('example.html')
