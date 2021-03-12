from flask import Blueprint, render_template

stats_bp = Blueprint('stats_bp', __name__,
    template_folder='templates/stats',
    static_folder='static/stats')


@stats_bp.route('/example')
def index():
    return render_template('example.html')
