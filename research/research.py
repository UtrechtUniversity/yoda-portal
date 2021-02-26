from flask import Blueprint, render_template

research_bp = Blueprint('research_bp', __name__,
    template_folder='templates',
    static_folder='static')

@research_bp.route('/example')
def example():
    return render_template('research/example.html')
