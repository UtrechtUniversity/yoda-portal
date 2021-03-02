from flask import Blueprint, render_template

general_bp = Blueprint('general_bp', __name__,
    template_folder='templates/general',
    static_folder='static/general',
    static_url_path='/static'
    )

@general_bp.route('/')
def index():
    return render_template('index.html')

@general_bp.route('/banaan')
def appel():
    return render_template('head.html')
