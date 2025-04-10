#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2024-2025, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
from typing import Callable, List, Optional

from flask import current_app as app, g, request, session
from flask_caching import Cache

import api
from util import log_error

# Create a global ThreadPoolExecutor.
executor = ThreadPoolExecutor(max_workers=2)

# Configuration for caching.
config = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_KEY_PREFIX": "yoda_portal_cache:",
    "CACHE_DEFAULT_TIMEOUT": 3600,  # 1 hour
    "CACHE_REDIS_HOST": "localhost",
    "CACHE_REDIS_PORT": 6379,
    "CACHE_REDIS_DB": 1,
    "CACHE_OPTIONS": {"socket_timeout": 2, "retry_on_timeout": True},
}

# Initialize the cache.
cache = Cache(config=config)

# API cache timeouts configuration.
API_CACHE_TIMEOUTS = {
    "group_data":                                      {"prepopulate": True,  "timeout": 3600},
    "notifications_load":                              {"prepopulate": True,  "timeout": 120},
    "resource_browse_group_data":                      {"prepopulate": True,  "timeout": 3600},
    "resource_category_stats":                         {"prepopulate": True,  "timeout": 3600},
    "resource_monthly_category_stats":                 {"prepopulate": True,  "timeout": 3600},
    "resource_full_year_differentiated_group_storage": {"prepopulate": False, "timeout": 3600},
    "schema_get_schemas":                              {"prepopulate": True,  "timeout": 3600},
    "settings_load":                                   {"prepopulate": True,  "timeout": 3600},
    "token_load":                                      {"prepopulate": True,  "timeout": 3600},
    "vault_get_publication_terms":                     {"prepopulate": True,  "timeout": 3600},
    "vault_preservable_formats_lists":                 {"prepopulate": True,  "timeout": 3600},
}

# API cache default parameters configuration.
API_CACHE_PARAMS = {
    "resource_browse_group_data": {
        "default_params": {"offset": 0, "limit": 200, "sort_order": "asc", "sort_on": "name", "search_groups": ""}
    },
}

# API cache clear configuration.
API_CACHE_CLEAR = {
    "admin_save_settings":          {"type": "global", "endpoints": ["vault_get_publication_terms",
                                                                     "vault_preservable_formats_lists"]},
    "group_create":                 {"type": "global", "endpoints": ["group_data"]},
    "group_update":                 {"type": "global", "endpoints": ["group_data"]},
    "group_delete":                 {"type": "global", "endpoints": ["group_data"]},
    "group_user_add":               {"type": "global", "endpoints": ["group_data"]},
    "group_user_update_role":       {"type": "global", "endpoints": ["group_data"]},
    "group_remove_user_from_group": {"type": "global", "endpoints": ["group_data"]},
    "group_process_csv":            {"type": "global", "endpoints": ["group_data"]},
    "notifications_dismiss":        {"type": "user",   "endpoints": ["notifications_load"]},
    "notifications_dismiss_all":    {"type": "user",   "endpoints": ["notifications_load"]},
    "settings_save":                {"type": "user",   "endpoints": ["settings_load"]},
    "token_generate":               {"type": "user",   "endpoints": ["token_load"]},
    "token_delete":                 {"type": "user",   "endpoints": ["token_load"]},
}


def authenticated() -> bool:
    """Check if the user is authenticated.

    :returns: True if the user is authenticated, False otherwise
    """
    return g.get("user") is not None and g.get("irods") is not None


def get_user_identifier() -> str:
    """Get user identifier generated from username, return unredacted username in development environments.

    :returns: User identifier
    """
    if authenticated():
        user = g.get('user')
        is_development = app.config.get("YODA_ENVIRONMENT") == "development"
        return user if is_development else hashlib.shake_256(user.encode("utf-8")).hexdigest(20)
    else:
        return "unauthenticated"


def make_key(api_key: Optional[str] = None) -> str:
    """Generate a cache key based on the request and authentication status.

    :param api_key: Optional custom key identifying API endpoint. If None, defaults to request endpoint and method

    :returns: A string representing the cache key
    """
    if api_key is None:
        key = f"view_{request.endpoint}_{request.method}:{session.sid}"
    else:
        key = f"api_{api_key}"

    user_identifier = get_user_identifier()

    return f"{user_identifier}:{key}"


def get_api_cache_functions() -> list:
    """Return a list of function names from the API_CACHE_TIMEOUTS configuration."""
    return [key for key, value in API_CACHE_TIMEOUTS.items() if value["prepopulate"]]


def get_api_cache_timeout(fn: str) -> int:
    """Retrieve the cache timeout for a specific API function.

    :param fn: The name of the API function

    :returns: The cache timeout in seconds, or 0 if not found
    """
    return API_CACHE_TIMEOUTS.get(fn, {"timeout": 0})["timeout"]


def filter_cache_keys(substring: str) -> List[str]:
    """Retrieve cache keys that contain a specified substring using scan.

    :param substring: The substring to search for in cache key names

    :returns: A list of matching cache keys
    """
    prefix = cache.cache.key_prefix
    keys = []
    cursor = 0

    while True:
        cursor, partial_keys = cache.cache._write_client.scan(cursor, match=f"*{substring}*")
        keys.extend(partial_keys)
        if cursor == 0:
            break

    return [bs.decode("utf-8")[len(prefix):] for bs in keys]


def clear_view_cache_keys(all_users: bool = False) -> None:
    """Clear view cache keys associated with the current user or all users.

    :param all_users: If True, clear view cache keys for all users
    """
    if all_users:
        filter_key = ":view_"
    else:
        user_identifier = get_user_identifier()
        filter_key = f"{user_identifier}:view_"

    # Get the keys to delete.
    keys_to_delete = list(filter_cache_keys(filter_key))

    # Attempt to delete the keys from the cache.
    try:
        cache.delete_many(*keys_to_delete)
    except Exception:
        log_error(f"Error deleting view cache keys: {keys_to_delete}")


def clear_api_cache_keys(fn: str) -> None:
    """Clear API cache keys associated with a specified API function.

    :param fn: The name of the API function
    """
    if fn in API_CACHE_CLEAR:
        for endpoint in API_CACHE_CLEAR[fn]["endpoints"]:
            # Determine the key to filter based on the type.
            if API_CACHE_CLEAR[fn]["type"] == "user":
                filter_key = make_key(endpoint)
            else:
                filter_key = endpoint

            # Get the keys to delete.
            keys_to_delete = list(filter_cache_keys(filter_key))
            # Attempt to delete the keys from the cache.
            try:
                cache.delete_many(*keys_to_delete)
            except Exception:
                log_error(f"Error deleting API cache keys: {keys_to_delete}")


def populate_api_cache(fn: str, user: str, irods: str, session_id: str) -> None:
    """Function to prepopulate the API cache for specified function."""
    # Set and session context.
    g.user = user
    g.irods = irods
    session.sid = session_id

    if authenticated():
        data = {}
        if fn in API_CACHE_PARAMS:
            data = API_CACHE_PARAMS[fn]["default_params"]

        params = json.dumps(data)
        encoded_params = hashlib.shake_256(params.encode("utf-8")).hexdigest(20)
        cache_key = make_key(f"{fn}:{encoded_params}")
        if cache.get(cache_key) is None:
            try:
                api.call(fn, data)
            except Exception as e:
                log_error(f"Error prepopulating cache {fn}: {e}")


def cache_view() -> Callable:
    """Custom decorator to conditionally apply caching to views."""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: str, **kwargs: int) -> Callable:
            try:
                return cache.cached(make_cache_key=make_key)(f)(*args, **kwargs)
            except Exception:
                return f(*args, **kwargs)

        return wrapped
    return decorator
