from flask import Blueprint, render_template, session

general_bp = Blueprint('general_bp', __name__,
    template_folder='templates/general',
    static_folder='static/general',
    static_url_path='/static'
    )

@general_bp.route('/')
def index():
    return render_template('index.html')

@general_bp.route('/test')
def api_test():
    return render_template('api_test.html')
