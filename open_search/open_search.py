#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2022, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

import json
import re
from datetime import datetime
from typing import Any, Dict, Optional

import jsonavu
from flask import Blueprint, jsonify, render_template, request, Response
from opensearchpy import OpenSearch

open_search_bp = Blueprint('open_search_bp', __name__,
                           template_folder='templates',
                           static_folder='static/open_search',
                           static_url_path='/assets')

open_search_host = 'localhost'
open_search_port = 9200


@open_search_bp.route('/')
def index() -> Response:
    searchTerm = request.args.get('q', None)

    if searchTerm is None:
        searchTerm = ''

    return render_template('open_search/search.html',
                           searchTerm=searchTerm)


@open_search_bp.route('/query', methods=['POST'])
def _query() -> Response:
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


def query(name: str, value: str,
          start: int = 0, size: int = 500,
          sort: Optional[str] = None,
          reverse: bool = False) -> Dict[str, Any]:
    result = {
        'query': {
            'name': name,
            'value': value,
            'from': start,
            'size': size
        },
        'matches': [],
        'total_matches': 0
    }

    try:
        client = OpenSearch(
            hosts=[{'host': open_search_host, 'port': open_search_port}],
            http_compress=True
        )
    except Exception as e:
        result['status'] = repr(e)
        return result

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

    try:
        response = client.search(body=query, index='yoda')
    except Exception as e:
        result['status'] = repr(e)
        return result

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
    result['matches'] = matches
    result['total_matches'] = response['hits']['total']['value']
    result['status'] = 'ok'
    if sort is not None:
        result['query']['sort'] = sort
        result['query']['reverse'] = reverse
    return result


@open_search_bp.route('/faceted_query', methods=['POST'])
def _faceted_query() -> Response:
    data = json.loads(request.form['data'])
    if 'value' in data:
        value = data['value']
    else:
        value = None
    facets = data['facets']
    ranges = data['ranges']
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

    res = faceted_query(value, facets, ranges, filters, start=start, size=size, sort=sort, reverse=reverse)
    code = 200

    if res['status'] != 'ok':
        code = 400

    response = jsonify(res)
    response.status_code = code
    return response


def faceted_query(value, facets, ranges, filters, start=0, size=500, sort=None, reverse=False):
    result = {
        'query': {
            'facets': facets,
            'ranges': ranges,
            'filters': filters,
            'from': start,
            'size': size
        },
        'matches': [],
        'total_matches': 0,
        'facets': {}
    }

    try:
        client = OpenSearch(
            hosts=[{'host': open_search_host, 'port': open_search_port}],
            http_compress=True
        )
    except Exception as e:
        result['status'] = repr(e)
        return result

    if value != "":
        searchList = [
            {
                'term': {
                    'metadataEntries.unit.raw': 'FlatIndex'
                }
            }
        ]
        for name in re.split(' +', value.lower()):
            searchList.append({
                'prefix': {
                    'metadataEntries.value': name
                }
            })
        searchQuery = {
            'nested': {
                'path': 'metadataEntries',
                'query': {
                    'bool': {
                        'must': searchList
                    }
                }
            }
        }
    else:
        searchQuery = {
            'nested': {
                'path': 'metadataEntries',
                'query': {
                    'term': {
                        'metadataEntries.unit.raw': 'FlatIndex'
                    }
                }
            }
        }

    facetList = {}
    if len(facets) != 0:
        for facet in facets:
            if facet == 'Person':
                filter = {
                    'bool': {
                        'should': [
                            {
                                'term': {
                                    'metadataEntries.attribute.raw': 'Creator'
                                }
                            }, {
                                'term': {
                                    'metadataEntries.attribute.raw': 'Contributor'
                                }
                            }
                        ],
                        'minimum_should_match': 1
                    }
                }
            else:
                filter = {
                    'term': {
                        'metadataEntries.attribute.raw': facet
                    }
                }
            facetList[facet] = {
                'filter': filter,
                'aggregations': {
                    'value': {
                        'terms': {
                            'field': 'metadataEntries.value.raw'
                        }
                    }
                }
            }
    if len(ranges) != 0:
        for range in ranges:
            facet = range['name']
            if facet not in facetList:
                aggregations = {
                    'range': {
                        'field': 'metadataEntries.value.number',
                        'ranges': []
                    }
                }
                facetList[facet] = {
                    'filter': {
                        'term': {
                            'metadataEntries.attribute.raw': facet
                        }
                    },
                    'aggregations': {
                        'value': aggregations
                    }
                }
            else:
                aggregations = facetList[facet]['aggregations']['value']
                if 'range' not in aggregations:
                    aggregations['range'] = {
                        'field': 'metadataEntries.value.number',
                        'ranges': []
                    }
            aggregations['range']['ranges'].append({
                'from': range['from'],
                'to': str(int(range['to']) + 1)
            })

    if len(facetList) != 0:
        query = {
            'query': searchQuery,
            'size': 0,
            'aggregations': {
                'metadataEntries': {
                    'nested': {
                        'path': 'metadataEntries'
                    },
                    'aggregations': facetList
                }
            }
        }
        try:
            response = client.search(body=query, index='yoda')
        except Exception as e:
            result['status'] = repr(e)
            return result

        facetList = {}
        if 'aggregations' in response:
            aggregations = response['aggregations']['metadataEntries']
            for facet, buckets in aggregations.items():
                if not isinstance(buckets, int):
                    bucketList = []
                    for bucket in buckets['value']['buckets']:
                        if 'from' in bucket:
                            bucketList.append({
                                'from': int(bucket['from']),
                                'to': int(bucket['to']) - 1,
                                'count': bucket['doc_count']
                            })
                        else:
                            bucketList.append({
                                'value': bucket['key'],
                                'count': bucket['doc_count']
                            })
                    facetList[facet] = bucketList

    if len(filters) != 0:
        queryList = [searchQuery]
        filterDict = {}
        for filter in filters:
            attribute = filter['name']
            if attribute not in filterDict:
                filterDict[attribute] = {
                    'match': {
                        'term': {
                            'metadataEntries.attribute.raw': attribute
                        }
                    },
                    'should': []
                }
            if 'value' in filter:
                name = filter['value']
                if attribute == 'Person':
                    filterDict[attribute]['match'] = {
                        'bool': {
                            'should': [
                                {
                                    'term': {
                                        'metadataEntries.attribute.raw': 'Creator'
                                    }
                                }, {
                                    'term': {
                                        'metadataEntries.attribute.raw': 'Contributor'
                                    }
                                }
                            ],
                            'minimum_should_match': 1
                        }
                    }
                    prefixList = []
                    nameList = re.split(' +', name.lower())
                    for name in nameList:
                        prefixList.append({
                            'prefix': {
                                'metadataEntries.value': name
                            }
                        })
                    filterDict[attribute]['should'].append({
                        'bool': {
                            'must': prefixList
                        }
                    })
                else:
                    filterDict[attribute]['should'].append({
                        'term': {
                            'metadataEntries.value.raw': name
                        }
                    })
            else:
                filterDict[attribute]['should'].append({
                    'range': {
                        'metadataEntries.value.number': {
                            'gte': filter['from'],
                            'lte': filter['to']
                        }
                    }
                })
        for filter in filterDict.values():
            queryList.append({
                'nested': {
                    'path': 'metadataEntries',
                    'query': {
                        'bool': {
                            'must': [
                                filter['match'],
                                {
                                    'term': {
                                        'metadataEntries.unit.raw': 'FlatIndex'
                                    }
                                }
                            ],
                            'should': filter['should'],
                            'minimum_should_match': 1
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

    try:
        response = client.search(body=query, index='yoda')
    except Exception as e:
        result['status'] = repr(e)
        return result

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
    result['matches'] = matches
    result['total_matches'] = response['hits']['total']['value']
    result['facets'] = facetList
    result['status'] = 'ok'
    if value is not None:
        result['query']['value'] = value
    if sort is not None:
        result['query']['sort'] = sort
        result['query']['reverse'] = reverse
    return result


@open_search_bp.route('/metadata', methods=['POST'])
def _metadata() -> Response:
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


def metadata(value: str) -> Dict[str, Any]:
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
