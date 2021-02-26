from flask import Blueprint, render_template

vault_bp = Blueprint('vault_bp', __name__,
    template_folder='templates',
    static_folder='static')

@vault_bp.route('/example')
def example():
    return render_template('vault/example.html')
