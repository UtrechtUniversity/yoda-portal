Python Yoda portal prototype
============================

NOT READY FOR PRODUCTION USE

This is a small prototype for a Flask rewrite of Yoda portal
https://github.com/UtrechtUniversity/yoda-portal/

Static files and templates are based on a yoda portal development
version of circa 2020-01. Only the home, login and browse pages are
implemented. Additionally there is a working API endpoint.

Apply this patch to the local python-irodsclient installation in order
to make use of keep-alive benefits:

diff --git a/irods/rule.py b/irods/rule.py
index 0471cda..93146a7 100644
--- a/irods/rule.py
+++ b/irods/rule.py
@@ -75,5 +75,4 @@ class Rule(object):
             conn.send(request)
             response = conn.recv()
             out_param_array = response.get_main_message(MsParamArray)
-            self.session.cleanup()
         return out_param_array


Run with:  FLASK_APP=app.py flask run

Or use the vhost file in this directory. Either way some tweaking to
your (virtual) environment or vhost may be needed.

Dependencies: Install with, for example:

pip3 install -U Flask
pip3 install -U Flask-WTF
pip3 install mod-wsgi
mod_wsgi-express install-module > /etc/httpd/conf.modules.d/02-wsgi.conf


Copyright (c) 2020, Utrecht University
All rights reserved.
