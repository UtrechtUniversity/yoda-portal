#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021-2024, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import threading
import time
from typing import Dict, Optional

from irods.session import iRODSSession

TTL = 60 * 30   # Time to live (TTL) for Flask sessions.
IRODS_TTL = 60  # Time to live (TTL) for iRODS sessions.


class Session(object):
    def __init__(self, sid: str, irods: iRODSSession) -> None:
        """Session object storing the iRODS session object.

        :param sid:   Flask session identifier
        :param irods: iRODS session
        """
        self.sid: str             = sid               # Flask session identifier
        self.time: float          = time.time()       # Flask session start time
        self.irods: iRODSSession  = irods             # iRODS session
        self.irods_time: float    = time.time()       # iRODS session start time
        self.lock: threading.Lock = threading.Lock()


sessions: Dict[str, Session] = dict()  # Custom session dict instead of Flask session (cannot pickle iRODS session)
lock: threading.Lock = threading.Lock()


def gc() -> None:
    """Session garbage collection."""
    while True:
        with lock:
            t = time.time()
            global sessions

            # Cleanup iRODS sessions that exceed the iRODS session TTL.
            for _, s in sessions.items():
                if t - s.irods_time > IRODS_TTL and not s.lock.locked():
                    s.irods.cleanup()
                    s.irods_time = time.time()

            # Remove sessions that exceed the Flask session TTL.
            sessions = {k: v for k, v in sessions.items() if t - v.time < TTL or v.lock.locked()}

        time.sleep(1)


gc_thread = threading.Thread(target=gc, name='irods-session-gc', daemon=True)
gc_thread.start()


def get(sid: str) -> Optional[iRODSSession]:
    """Retrieve iRODS session object from session."""
    if sid in sessions:
        s: Session = sessions[sid]
        s.lock.acquire()
    else:
        return None

    return s.irods


def add(sid: str, irods: iRODSSession) -> None:
    """Add Flask sid and iRODS session to our custom session dict.

    :param sid:   Flask session identifier
    :param irods: iRODS session
    """
    global sessions
    s: Session = Session(sid, irods)
    sessions[sid] = s
    s.time = time.time()
    s.irods_time = time.time()
    s.lock.acquire()
    print(f"[login]: Successfully connected to iRODS for session {sid}'")


def release(sid: str) -> None:
    """Release a session.

    :param sid: Flask session identifier
    """
    global sessions
    if sid in sessions:
        s: Session = sessions[sid]
        s.time = time.time()
        s.irods_time = time.time()
        s.lock.release()


def clean(sid: str) -> None:
    """Clean a session.

    :param sid: Flask session identifier
    """
    global sessions
    if sid in sessions:
        s: Session = sessions[sid]
        s.irods.cleanup()
        del sessions[sid]
        print(f"[logout]: Cleanup session {sid}")


def extend(sid: str) -> None:
    """Extend session TTLs.

    :param sid: Flask session identifier
    """
    global sessions
    if sid in sessions:
        s: Session = sessions[sid]
        s.time = time.time()
        s.irods_time = time.time()
