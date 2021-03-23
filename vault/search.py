#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import vault


@vault_bp.route('/unset_session')
def unset_session():
    session.pop('research-search-term', None)
    session.pop('research-search-start', None)
    session.pop('research-search-type', None)
    session.pop('research-search-order-dir', None)
    session.pop('research-search-order-column', None)
    session.pop('research-search-status-value', None)


@vault_bp.route('/set_session')
def set_session()
    value = request.args.get('value')
    type = request.args.get('type')

    if type == 'status':
        session['research-search-status-value'] = value
    else:
        session['research-search-term'] = value
        session.pop('research-search-status-value', None)

    session['research-search-type'] = type
    session['research-search-start'] = 0
