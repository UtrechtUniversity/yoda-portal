#!/usr/bin/env python3
from flask import Blueprint, render_template, g
import api
import json

general_bp = Blueprint('general_bp', __name__,
                       template_folder='templates/general',
                       static_folder='static/general',
                       static_url_path='/static')


@general_bp.route('/')
def index():
    return render_template('index.html')


@general_bp.route('/test')
def api_test():
    data = {"coll":"/tempZone/home"} 
    response = api.call('browse_folder', data)
    response_dict = json.loads(response)
    
    # Uit de data het veld 'total' halen: 
    total = response_dict['data']['total'] 
    return render_template('api_test.html', in_app=total)
