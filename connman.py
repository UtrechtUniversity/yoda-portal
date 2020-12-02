#!/usr/bin/env python3

"""Manages iRODS session keep-alive."""

import threading
from irods.session import iRODSSession
import time

TTL = 60

# XXX SSL magic to allow irods_ssl_verify_server=none {{{

# Taken from https://www.python.org/dev/peps/pep-0476/#id29 (modified slightly)
import ssl
try:
    _create_unverified_context = ssl._create_unverified_context
except AttributeError:
    # Legacy Python that doesn't verify HTTPS certificates by default
    pass
else:
    # Handle target environment that doesn't support HTTPS verification
    # ssl._create_default_context = _create_unverified_context
    ssl.create_default_context = lambda *_, **__: _create_unverified_context()

# }}}

class Session(object):
    def __init__(self, username, password, irods):
        self.username = username
        self.password = password
        self.irods    = irods
        self.time     = time.time()
        self.lock     = threading.Lock()

    def __del__(self):
        self.irods.cleanup()
        print('[gc] dropped session of user {}'.format(self.username))

sessions = dict()
lock = threading.Lock()

def gc():
    while True:
        with lock:
            t = time.time()
            global sessions
            sessions = {k:v for k,v in sessions.items() if t - v.time < TTL or v.lock.locked()}

        time.sleep(1)

gc = threading.Thread(target=gc, name='irods-session-gc', daemon=True)
gc.start()

def make(name, password):
    try:
        irods = iRODSSession(host     = 'localhost',
                             port     = 1247,
                             user     = name,
                             password = password,
                             zone     = 'tempZone',
                             authentication_scheme = 'pam',
                             irods_encryption_algorithm       = "AES-256-CBC",
                             irods_encryption_key_size        = 32,
                             irods_encryption_num_hash_rounds = 16,
                             irods_encryption_salt_size       = 8,
                             irods_client_server_negotiation  = 'request_server_negotiation',
                             irods_client_server_policy       = 'CS_NEG_REQUIRE',
                             irods_ssl_verify_server          = 'none') # ignored, use ssl hack above.
        _ = irods.server_version # Fail early if auth / network is bad.
    except Exception as e:
        print('could not login: ' + str(e))
        return None
    return irods

def get(name, password):
    if not TTL:
        return Session(name, password, make(name, password))
    with lock:
        if (name, password) in sessions:
            s = sessions[(name, password)]
        else:
            irods = make(name, password)
            if irods is None:
                return None

            s = Session(name, password, irods)
            sessions[(name, password)] = s

    s.lock.acquire()
    s.time = time.time()
    return s
