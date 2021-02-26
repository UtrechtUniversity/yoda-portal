from flask import Blueprint, render_template

group_bp = Blueprint('group_manager', __name__,
    template_folder='templates',
    static_folder='static')


@group_bp.route('/example')
def example():
    return render_template('group_manager/example.html')
