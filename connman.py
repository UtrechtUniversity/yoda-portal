#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import threading
import time

TTL = 60 * 30


class Session(object):
    def __init__(self, sid, irods):
        self.sid   = sid
        self.irods = irods
        self.time  = time.time()
        self.lock  = threading.Lock()

    def __del__(self):
        self.irods.cleanup()
        print('[gc/logout]: Dropped iRODS session of session {}'.format(self.sid))


sessions = dict()
lock = threading.Lock()


def gc():
    while True:
        with lock:
            t = time.time()
            global sessions
            sessions = {k: v for k, v in sessions.items() if t - v.time < TTL or v.lock.locked()}

        time.sleep(1)


gc = threading.Thread(target=gc, name='irods-session-gc', daemon=True)
gc.start()


def get(sid):
    if sid in sessions:
        s = sessions[sid]
        s.lock.acquire()
    else:
        return None

    return s.irods


def add(sid, irods):
    global sessions
    s = Session(sid, irods)
    sessions[sid] = s
    s.time = time.time()
    s.lock.acquire()
    print('[login]: Succesfully connected to iRODS for session {}'.format(sid))


def release(sid):
    global sessions
    if sid in sessions:
        s = sessions[sid]
        s.time = time.time()
        s.lock.release()


def clean(sid):
    global sessions
    if sid in sessions:
        del sessions[sid]
