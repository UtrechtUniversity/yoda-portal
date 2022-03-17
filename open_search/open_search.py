#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import json
from datetime import datetime

import jsonavu
from flask import Blueprint, jsonify, render_template, request
from opensearchpy import OpenSearch

open_search_bp = Blueprint('open_search_bp', __name__,
                           template_folder='templates',
                           static_folder='static/open_search',
                           static_url_path='/assets')

open_search_host = 'localhost'
open_search_port = 9200


@open_search_bp.route('/')
def index():
    searchTerm = request.args.get('q', None)

    if searchTerm is None:
        searchTerm = ''

    return render_template('open_search/search.html',
                           searchTerm=searchTerm)


@open_search_bp.route('/query', methods=['POST'])
def _query():
    data = json.loads(request.form['data'])
    name = data['name']
    value = data['value']
    if 'from' in data:
        start = data['from']
        size = data['size']
    else:
        start = 0
        size = 500
    if 'sort' in data:
        sort = data['sort']
    else:
        sort = None
    if 'reverse' in data:
        reverse = data['reverse']
    else:
        reverse = False

    res = query(name, value, start=start, size=size, sort=sort, reverse=reverse)
    code = 200

    if res['status'] != 'ok':
        code = 400

    response = jsonify(res)
    response.status_code = code
    return response


def query(name, value, start=0, size=500, sort=None, reverse=False):
    client = OpenSearch(
        hosts=[{'host': open_search_host, 'port': open_search_port}],
        http_compress=True
    )

    query = {
        'from': start,
        'size': size,
        'track_total_hits': True,
        'query': {
            'nested': {
                'path': 'metadataEntries',
                'query': {
                    'bool': {
                        'must': [
                            {
                                'term': {
                                    'metadataEntries.attribute.raw': name
                                }
                            }, {
                                'term': {
                                    'metadataEntries.unit.raw': 'FlatIndex'
                                }
                            }, {
                                'match': {
                                    'metadataEntries.value': value
                                }
                            }
                        ]
                    }
                }
            }
        }
    }

    if sort is not None:
        if reverse:
            order = 'desc'
        else:
            order = 'asc'
        query['sort'] = [
            {
                'metadataEntries.value.raw': {
                    'order': order,
                    'nested': {
                        'path': 'metadataEntries',
                        'filter': {
                            'term': {
                                'metadataEntries.attribute.raw': sort
                            }
                        }
                    }
                }
            }
        ]

    response = client.search(body=query, index='yoda')
    matches = []
    for hit in response['hits']['hits']:
        src = hit['_source']
        match = {
            'fileName': src['fileName'],
            'parentPath': src['parentPath']
        }
        attributes = []
        for avu in src['metadataEntries']:
            if avu['unit'] == 'FlatIndex':
                attributes.append({
                    'name': avu['attribute'],
                    'value': avu['value']
                })
        match['attributes'] = attributes
        matches.append(match)
    result = {
        'query': {
            'name': name,
            'value': value,
            'from': start,
            'size': size
        },
        'matches': matches,
        'total_matches': response['hits']['total']['value'],
        'status': 'ok'
    }
    if sort is not None:
        result['query']['sort'] = sort
        result['query']['reverse'] = reverse
    return result


@open_search_bp.route('/faceted_query', methods=['POST'])
def _faceted_query():
    data = json.loads(request.form['data'])
    value = data['value']
    facets = data['facets']
    filters = data['filters']
    if 'from' in data:
        start = data['from']
        size = data['size']
    else:
        start = 0
        size = 500
    if 'sort' in data:
        sort = data['sort']
    else:
        sort = None
    if 'reverse' in data:
        reverse = data['reverse']
    else:
        reverse = False

    res = faceted_query(value, facets, filters, start=start, size=size, sort=sort, reverse=reverse)
    code = 200

    if res['status'] != 'ok':
        code = 400

    response = jsonify(res)
    response.status_code = code
    return response


def faceted_query(value, facets, filters, start=0, size=500, sort=None, reverse=False):
    client = OpenSearch(
        hosts=[{'host': open_search_host, 'port': open_search_port}],
        http_compress=True
    )

    searchQuery = {
        'nested': {
            'path': 'metadataEntries',
            'query': {
                'bool': {
                    'must': [
                        {
                            'term': {
                                'metadataEntries.unit.raw': 'FlatIndex'
                            }
                        }, {
                            'match': {
                                'metadataEntries.value': value
                            }
                        }
                    ]
                }
            }
        }
    }

    if len(filters) is not 0:
        queryList = [ searchQuery ]
        for attribute, value in filters.items():
            queryList.append({
                'nested': {
                    'path': 'metadataEntries',
                    'query': {
                        'bool': {
                            'must': [
                                {
                                    'term': {
                                        'metadataEntries.attribute.raw': attribute
                                    }
                                }, {
                                    'term': {
                                        'metadataEntries.unit.raw': 'FlatIndex'
                                    }
                                }, {
                                    'term': {
                                        'metadataEntries.value.raw': value
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        searchQuery = {
            'bool': {
                'must': queryList
            }
        }

    query = {
        'from': start,
        'size': size,
        'track_total_hits': True,
        'query': searchQuery
    }

    if len(facets) is not 0:
        facetList = {}
        for facet in facets:
            facetList[facet] = {
                'filter': {
                    'term': {
                        'metadataEntries.attribute.raw' : facet
                    }
                },
                'aggregations': {
                    'value': {
                        'terms': {
                            'field': 'metadataEntries.value.raw'
                        }
                    }
                }
            }
        query['aggregations'] = {
            'metadataEntries': {
                'nested': {
                    'path': 'metadataEntries'
                },
                'aggregations': facetList
            }
        }

    if sort is not None:
        if reverse:
            order = 'desc'
        else:
            order = 'asc'
        query['sort'] = [
            {
                'metadataEntries.value.raw': {
                    'order': order,
                    'nested': {
                        'path': 'metadataEntries',
                        'filter': {
                            'term': {
                                'metadataEntries.attribute.raw': sort
                            }
                        }
                    }
                }
            }
        ]

    response = client.search(body=query, index='yoda')
    matches = []
    for hit in response['hits']['hits']:
        src = hit['_source']
        match = {
            'fileName': src['fileName'],
            'parentPath': src['parentPath']
        }
        attributes = []
        for avu in src['metadataEntries']:
            if avu['unit'] == 'FlatIndex':
                attributes.append({
                    'name': avu['attribute'],
                    'value': avu['value']
                })
        match['attributes'] = attributes
        matches.append(match)
    aggregations = response['aggregations']['metadataEntries']
    facetList = {}
    for facet, buckets in aggregations.items():
        if not isinstance(buckets, int):
            bucketList = []
            for bucket in buckets['value']['buckets']:
                bucketList.append({
                    'value': bucket['key'],
                    'count': bucket['doc_count']
                })
            facetList[facet] = bucketList
    result = {
        'query': {
            'value': value,
            'facets': facets,
            'filters': filters,
            'from': start,
            'size': size
        },
        'matches': matches,
        'total_matches': response['hits']['total']['value'],
        'facets': facetList,
        'status': 'ok'
    }
    if sort is not None:
        result['query']['sort'] = sort
        result['query']['reverse'] = reverse
    return result


@open_search_bp.route('/metadata', methods=['POST'])
def _metadata():
    data = json.loads(request.form['data'])
    uuid = data['uuid']
    code = 200

    # Query data package metadata on UUID.
    res = metadata(uuid)
    if res['status'] != 'ok':
        code = 400

    if res['total_matches'] == 1:
        avus = res['matches'][0]
        metadata_json = jsonavu.avu2json(avus['attributes'], 'usr')
    else:
        code = 400

    # Query data package on UUID.
    res = query('Data_Package_Reference', uuid, size=1)
    if res['status'] != 'ok':
        code = 400

    # Transform search result into data package metadata.
    deposit_date = ""
    if res['total_matches'] == 1:
        data_package = res['matches'][0]

        for attribute in data_package['attributes']:
            name = attribute['name']
            value = attribute['value']
            if name == 'Creation_Time':
                deposit_date = datetime.utcfromtimestamp(int(value)).strftime('%Y-%m-%d')
    else:
        code = 400

    response = jsonify({"metadata": metadata_json, "deposit_date": deposit_date})
    response.status_code = code

    return response


def metadata(value):
    client = OpenSearch(
        hosts=[{'host': open_search_host, 'port': open_search_port}],
        http_compress=True
    )

    query = {
        'from': 0,
        'size': 1,
        'track_total_hits': True,
        'query': {
            'nested': {
                'path': 'metadataEntries',
                'query': {
                    'bool': {
                        'must': [
                            {
                                'term': {
                                    'metadataEntries.attribute.raw': 'org_data_package_reference'
                                }
                            }, {
                                'match': {
                                    'metadataEntries.value': value
                                }
                            }
                        ]
                    }
                }
            }
        }
    }

    response = client.search(body=query, index='yoda')
    matches = []
    for hit in response['hits']['hits']:
        attributes = []
        match = {}
        src = hit['_source']
        for avu in src['metadataEntries']:
            if avu['unit'].startswith('usr_'):
                attributes.append({
                    'a': avu['attribute'],
                    'v': avu['value'],
                    'u': avu['unit'],
                })
        match['attributes'] = attributes
        matches.append(match)
    result = {
        'query': {
            'value': value,
        },
        'matches': matches,
        'total_matches': response['hits']['total']['value'],
        'status': 'ok'
    }

    return result
