from flask import Blueprint, render_template

stats_bp = Blueprint('stats_bp', __name__,
    template_folder='templates',
    static_folder='static')


@stats_bp.route('/example')
def example():
    return render_template('stats/example.html')
