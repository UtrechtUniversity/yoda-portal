#!/usr/bin/env python3

from flask import Flask
from flask import request, Response
from flask import session
from flask import g
from flask import render_template, redirect
from flask_wtf.csrf import CSRFProtect
import connman
import json
from irods import rule

app = Flask(__name__)
app.config['SECRET_KEY'] = 'bloep'  # XXX not for production use

# XXX CSRF needs to be disabled for API testing.
csrf = CSRFProtect(app)

# Authentication handling {{{

@app.before_request
def check_irods():
    if not request.endpoint or request.endpoint in ['login', 'static']:
        # No auth or iRODS session needed.
        # print('EP '+request.endpoint)
        return

    # XXX: For API testing, CORS.
    if request.method == 'OPTIONS':
        return Response(status=200)

    if request.endpoint == 'api' and request.authorization:
        # Using basic auth.
        username = request.authorization.username
        password = request.authorization.password

        s = connman.get(username, password)
        if s is None:
            # Return challenge.
            return Response(status=401,
                            headers={'WWW-Authenticate': 'Basic realm="Yoda"'})
        g.session = s
        g.irods   = s.irods
    else:
        # XXX CSRF needs to be disabled for API testing.
        csrf.protect()
        if 'username' in session and 'password' in session:
            username, password = session['username'], session['password']
        else:
            return redirect('/login', code=302)
        s = connman.get(username, password)

        if s is None:
            return redirect('/login', code=302)

        g.session = s
        g.irods   = s.irods

@app.after_request
def release_irods(x):
    if 'session' in dir(g) and g.session.lock.locked():
        g.session.lock.release()

    # XXX: For API testing.
    x.headers.add('Access-Control-Allow-Origin',  '*')
    x.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    x.headers.add('Access-Control-Allow-Methods', 'GET,POST')
    return x

# }}}
# Routes {{{

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        s = connman.get(request.form['username'], request.form['password'])
        if s is None:
            return render_template('login.html')
        g.session = s
        session['username'] = request.form['username']
        session['password'] = request.form['password']
        return redirect('/browse', code=302)
    else:
        return render_template('login.html')

@app.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return redirect('/', code=302)

@app.route('/browse', methods=['GET'])
def browse():
    return render_template('browse.html')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/<fn>', methods=['POST'])
def api(fn):
    if False and request.authorization:
        # Basic auth: data will be entire request body.
        data = request.json
    else:
        # XXX: (1) PHP-portal style api request body.
        data = json.loads(request.form['data'])

        # # XXX: (2) Toplevel arguments as form fields (experimental).
        # data = {}
        # for k, v in request.form.items():
        #     try:
        #         # XXX VERY dubious, unless properly correlated with API function signature.
        #         data[k] = json.loads(v)
        #     except:
        #         data[k] = v

    # print(data)
    x = rule.Rule(g.irods, body='a {{ api_{}(*x); }}'.format(fn), params={'*x': '"{}"'.format(json.dumps(data).replace('"', '\\"'))}, output='ruleExecOut').execute()
    x = x._values['MsParam_PI'][0]._values['inOutStruct']._values['stdoutBuf']
    x = x.buf[:x.buflen]
    if b'\x00' in x:
        x = x[:x.find(b'\x00')]

    return x.decode()

# }}}
