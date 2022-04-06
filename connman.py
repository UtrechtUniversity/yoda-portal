#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import threading
import time

TTL = 60 * 30


class Session(object):
    def __init__(self, sid, irods):
        """Session object storing the iRODS session object.

        :param sid:   Flask session identifier
        :param irods: iRODS session
        """
        self.sid   = sid
        self.irods = irods
        self.time  = time.time()
        self.lock  = threading.Lock()

    def __del__(self):
        self.irods.cleanup()
        print('[gc/logout]: Dropped iRODS session of session {}'.format(self.sid))


sessions = dict()  # Custom session dict instead of Flask session (cannot pickle iRODS session)
lock = threading.Lock()


def gc():
    """Session garbage collection."""
    while True:
        with lock:
            t = time.time()
            global sessions
            sessions = {k: v for k, v in sessions.items() if t - v.time < TTL or v.lock.locked()}

        time.sleep(1)


gc = threading.Thread(target=gc, name='irods-session-gc', daemon=True)
gc.start()


def get(sid):
    """Retrieve iRODS session object from session."""
    if sid in sessions:
        s = sessions[sid]
        s.lock.acquire()
    else:
        return None

    return s.irods


def add(sid, irods):
    """
    Add flask sid and irods session to our custom session dict

    :param sid:   Flask session identifier
    :param irods: iRODS session
    """
    global sessions
    s = Session(sid, irods)
    sessions[sid] = s
    s.time = time.time()
    s.lock.acquire()
    print('[login]: Successfully connected to iRODS for session {}'.format(sid))


def release(sid):
    """Release a session.

    :param sid:   Flask session identifier
    """
    global sessions
    if sid in sessions:
        s = sessions[sid]
        s.time = time.time()
        s.lock.release()


def clean(sid):
    """Clean a session.

    :param sid:   Flask session identifier
    """
    global sessions
    if sid in sessions:
        del sessions[sid]
