#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2021, Utrecht University'
__license__ = 'GPLv3, see LICENSE'

import os
from flask import Blueprint, render_template, redirect, url_for, g, flash, jsonify, make_response, request, session
from werkzeug.utils import secure_filename

deposit_bp = Blueprint('deposit_bp', __name__,
                       template_folder='templates',
                       static_folder='static/deposit',
                       static_url_path='/deposit')


"""
Deposit flow:
1. Upload data:     /deposit/
2. Add metadata:    /deposit/metadata/
3. Submit:          /deposit/submit/
"""


@deposit_bp.route('/', methods=['GET'])
def index():
    return render_template('deposit/deposit.html')

@deposit_bp.route('/prototype_upload')
def prototype_upload():
    """ alternative for above """
    return render_template('deposit/upload.html')


def get_chunk_name(uploaded_filename, chunk_number):
    return uploaded_filename + "_part_%03d" % chunk_number


@deposit_bp.route('/flow_upload', methods=['GET'])
def flow_upload_get():
    flow_identifier = request.args.get('flowIdentifier', type=str)
    flow_filename = request.args.get('flowFilename', type=str)
    flow_chunk_number = request.args.get('flowChunkNumber', type=int)

    filepath = request.args.get('filepath', type=str)

    if not flow_identifier or not flow_filename or not flow_chunk_number or not filepath:
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    # Build chunk folder path based on the parameters.
    temp_dir = os.path.join("/" + g.irods.zone, 'home', filepath, flow_identifier)

    # Chunk path based on the parameters.
    chunk_path = os.path.join(temp_dir, get_chunk_name(flow_filename, flow_chunk_number))

    session = g.irods
    if session.data_objects.exists(chunk_path):
        # Chunk already exists.
        response = make_response(jsonify({"message": "Chunk found"}), 200)
        response.headers["Content-Type"] = "application/json"
        return response
    else:
        # Chunk does not exists and needs to be uploaded.
        response = make_response(jsonify({"message": "Chunk not found"}), 204)
        response.headers["Content-Type"] = "application/json"
        return response


@deposit_bp.route('/flow_upload', methods=['POST'])
def flow_upload_post():
    flow_identifier = request.form.get('flowIdentifier', type=str)
    flow_filename = request.form.get('flowFilename', type=str)
    flow_chunk_number = request.form.get('flowChunkNumber', type=int)
    flow_total_chunks = request.form.get('flowTotalChunks', type=int)
    flow_chunk_size = request.form.get('flowChunkSize', type=int)
    flow_relative_path = request.form.get('flowRelativePath', type=str)

    relative_path = os.path.dirname(flow_relative_path)
    filepath = request.form.get('filepath', type=str)

    if (not flow_identifier or not flow_filename or not flow_chunk_number
       or not flow_total_chunks or not flow_chunk_size or not filepath):
        # Parameters are missing or invalid.
        response = make_response(jsonify({"message": "Parameter missing or invalid"}), 500)
        response.headers["Content-Type"] = "application/json"
        return response

    session = g.irods

    # Ensure temp chunk collection exists.
    if relative_path:
        base_dir = os.path.join("/" + g.irods.zone, 'home', filepath, relative_path)
        if not session.collections.exists(base_dir):
            session.collections.create(base_dir)
    else:
        base_dir = os.path.join("/" + g.irods.zone, 'home', filepath)

    # Get the chunk data.
    chunk_data = request.files['file']

    if flow_total_chunks == 1:
        file_path = os.path.join(base_dir, flow_filename)

        try:
            obj = session.data_objects.create(file_path)
            with obj.open('w+') as f:
                f.write(chunk_data.stream.read())
            f.close()
        except Exception:
            response = make_response(jsonify({"message": "Chunk upload failed"}), 500)
            response.headers["Content-Type"] = "application/json"
            return response
    else:
        # Ensure temp chunk collection exists.
        temp_dir = os.path.join(base_dir, flow_identifier)
        if not session.collections.exists(temp_dir):
            session.collections.create(temp_dir)

        # Save the chunk data.
        chunk_path = os.path.join(temp_dir, get_chunk_name(flow_filename, flow_chunk_number))
        try:
            obj = session.data_objects.create(chunk_path)

            with obj.open('w+') as f:
                f.write(chunk_data.stream.read())
            f.close()
        except Exception:
            response = make_response(jsonify({"message": "Chunk upload failed"}), 500)
            response.headers["Content-Type"] = "application/json"
            return response

        # Check if the upload is complete.
        chunk_paths = [os.path.join(temp_dir, get_chunk_name(flow_filename, x)) for x in range(1, flow_total_chunks + 1)]
        upload_complete = all([session.data_objects.exists(p) for p in chunk_paths])

        # Combine all the chunks to create the final file.
        if upload_complete:
            file_path = os.path.join(base_dir, flow_filename)

            obj = session.data_objects.create(file_path, force=True)

            with obj.open('w+') as f:
                chunk_number = 0
                for chunk in chunk_paths:
                    # read file
                    obj2 = session.data_objects.get(chunk)
                    with obj2.open('r') as f2:
                        f.seek(chunk_number * flow_chunk_size)
                        f.write(f2.read())
                    f2.close()
                    chunk_number += 1

                coll = session.collections.get(temp_dir)
                coll.remove(recurse=True, force=True)
            f.close()

    response = make_response(jsonify({"message": "Chunk upload succeeded"}), 200)
    response.headers["Content-Type"] = "application/json"
    return response




@deposit_bp.route('/metadata/form')
@deposit_bp.route('/metadata', methods=['GET'])
def metadata():
    path = request.args.get('path')
    return render_template('deposit/metadata.html', path=path)


@deposit_bp.route('/metadata', methods=['POST'])
def metadata_upload():
    """ Step2: Add metadata to your upload """
    return redirect(url_for('deposit_bp.submit'))


@deposit_bp.route('/submit', methods=['GET'])
def submit():
    """ Step 3: Submit upload """
    return render_template('deposit/submit.html')


@deposit_bp.route('/submit', methods=['POST'])
def submit_upload():
    """ Step 3: Submit upload """
    return render_template('deposit/thankyou.html')





