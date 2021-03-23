#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import vault

######################## ANDERS!!!!! ################
# $this->data['userIsAllowed'] = TRUE;

@vault_bp.route('/form')
def form():
    try:
        path = request.args.get('path')
    except:
        # REDIRECT research/browse
        return redirect(url_for('index')) ??

    path_start = app.config['path_start']

    full_path = path_start + path

    # Flash message handling
    try:
        flashMessage = session['flashMessage']
        flashMessageType = session['flashMessageType']
    except KeyError:
        flashMessage = ''
        flashMessageType = '' 

    # https://flask-wtf.readthedocs.io/en/stable/csrf.html
    # CSRF protection requires a secret key to securely sign the token. By default this will use the Flask app's SECRET_KEY. If you'd like to use a separate token you can set WTF_CSRF_SECRET_KEY.
    # Load CSRF token ??
    from flask_wtf.csrf import CSRFProtect
    csrf = CSRFProtect(app)
    $tokenName = $this->security->get_csrf_token_name();
    $tokenHash = $this->security->get_csrf_hash();

    formProperties = api.call('meta_form_load', ['coll': full_path])

    return render_template('metadata/form.html', 
        path=path,
        tokenName=tokenName,
        tokenHash=tokenHash,
        flashMessage=flashMessage,
        flashMessageType=flashMessageType,
        formProperties=formProperties)
