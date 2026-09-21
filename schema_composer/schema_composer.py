#!/usr/bin/env python3

__copyright__ = 'Copyright (c) 2026, Utrecht University'
__license__   = 'GPLv3, see LICENSE'

from functools import wraps
from typing import Any, Callable

from flask import (
    Blueprint,
    flash,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    Response,
    session,
    url_for,
)

import api
from util import log_error


schema_composer_bp = Blueprint(
    'schema_composer_bp',
    __name__,
    template_folder='templates/schema_composer',
    static_folder='static/schema_composer',
    static_url_path='/assets'
)


def schema_composer_required(f: Callable[..., Any]) -> Callable[..., Any]:
    """Check privileges for the Schema Composer."""
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        is_admin = getattr(g, 'admin', False) or session.get('admin', False)
        if not is_admin:
            flash('You do not have permission to access the Schema Composer.', 'danger')
            return redirect(url_for('general_bp.index'))
        return f(*args, **kwargs)
    return decorated_function


def get_building_blocks() -> list[Any]:
    result = api.call('schema_get_building_blocks')
    return result.get('data', result) if isinstance(result, dict) else []


def get_block_info(building_blocks: list[Any]) -> dict[str, dict[str, str]]:
    """Build a lookup of building block titles and descriptions."""
    block_info: dict[str, dict[str, str]] = {}
    for block in building_blocks:
        for block_name, block_data in block.items():
            schema = block_data.get('schema', {})
            block_info[block_name] = {
                'title': schema.get('title', block_name),
                'description': schema.get('description', ''),
            }
    return block_info


@schema_composer_bp.route('/')
@schema_composer_required
def index() -> Response:
    """Access the Schema Composer overview page."""
    try:
        result = api.call('schema_get_composed_schemas')
        composed_schemas = result.get('data', result) if isinstance(result, dict) else []
        building_blocks = get_building_blocks()
        return render_template(
            'overview.html',
            composed_schemas=composed_schemas,
            building_blocks=building_blocks,
            block_info=get_block_info(building_blocks)
        )
    except Exception:
        log_error('Error fetching schemas', True)
        flash('An unexpected error occurred while loading schemas.', 'danger')
        return render_template(
            'overview.html',
            composed_schemas=[],
            building_blocks=[],
            block_info={}
        )


@schema_composer_bp.route('/compose', methods=['GET'])
@schema_composer_required
def compose_create_get() -> Response:
    """Render the form for creating a new composed schema."""
    building_blocks = []
    try:
        building_blocks = get_building_blocks()
    except Exception:
        log_error('Error fetching building blocks', True)
        flash('Error loading building blocks.', 'danger')
    return render_template(
        'schema_composer.html',
        building_blocks=building_blocks,
        block_info=get_block_info(building_blocks),
        selected_blocks=[],
        identifier=None,
        description='',
        is_edit=False
    )


@schema_composer_bp.route('/compose', methods=['POST'])
@schema_composer_required
def compose_create_post() -> Response:
    """Process submission for creating a new composed schema."""
    schema_name = request.form.get('schema_name', '').strip()
    description = request.form.get('description', '').strip()
    chosen_blocks = request.form.getlist('building_blocks')
    building_blocks = []
    try:
        building_blocks = get_building_blocks()
    except Exception:
        log_error('Error fetching building blocks', True)
        flash('Error loading building blocks.', 'danger')
    block_info = get_block_info(building_blocks)

    if not schema_name:
        flash('Schema name is required.', 'warning')
    elif len(schema_name) > 50:
        flash('Schema name must be at most 50 characters.', 'warning')
    elif not schema_name.isalnum():
        flash('Schema name may contain only letters and numbers.', 'warning')
    elif not chosen_blocks:
        flash('At least one building block must be selected.', 'warning')
    else:
        try:
            result = api.call('schema_get_composed_schemas')
            if isinstance(result, dict):
                composed_schemas = result.get('data', result)
                if any(schema.get('name') == schema_name for schema in composed_schemas):
                    flash(f"Schema '{schema_name}' already exists.", 'warning')
                    return render_template(
                        'schema_composer.html',
                        building_blocks=building_blocks,
                        block_info=block_info,
                        selected_blocks=chosen_blocks,
                        identifier=schema_name,
                        description=description,
                        is_edit=False
                    )
            result = api.call(
                'schema_post_composed_schema',
                data={
                    'identifier': schema_name,
                    'description': description,
                    'blocks': chosen_blocks
                }
            )
            if result['status'] == 'ok':
                flash(f"Schema '{schema_name}' saved successfully.", 'success')
                return redirect(url_for('schema_composer_bp.index'))
            flash(
                result.get(
                    'message',
                    'Failed to save schema. Please verify the schema '
                    'name and building block selections.'
                ),
                'danger'
            )
        except Exception:
            log_error(f"Error creating composed schema '{schema_name}'", True)
            flash('An error occurred while saving the schema.', 'danger')
    return render_template(
        'schema_composer.html',
        building_blocks=building_blocks,
        block_info=block_info,
        selected_blocks=chosen_blocks,
        identifier=schema_name,
        description=description,
        is_edit=False
    )


@schema_composer_bp.route('/compose/<identifier>', methods=['GET'])
@schema_composer_required
def compose_edit_get(identifier: str) -> Response:
    """Render the form populated with an existing schema for editing."""
    building_blocks = []
    selected_blocks = []
    description = ''
    try:
        building_blocks = get_building_blocks()
    except Exception:
        log_error('Error fetching building blocks', True)
        flash('Error loading building blocks.', 'danger')
    try:
        result = api.call('schema_get_composed_schema', data={'identifier': identifier})
        if isinstance(result, dict):
            data = result.get('data', result)
            if isinstance(data, dict):
                selected_blocks = data.get('blocks', [])
                description = data.get('description', '')
    except Exception:
        log_error(f"Error fetching schema '{identifier}'", True)
        flash(f'Error loading schema {identifier}.', 'danger')
    return render_template(
        'schema_composer.html',
        building_blocks=building_blocks,
        block_info=get_block_info(building_blocks),
        selected_blocks=selected_blocks,
        identifier=identifier,
        description=description,
        is_edit=True
    )


@schema_composer_bp.route('/compose/<identifier>', methods=['POST'])
@schema_composer_required
def compose_edit_post(identifier: str) -> Response:
    """Process submission for updating an existing composed schema."""
    description = request.form.get('description', '').strip()
    chosen_blocks = request.form.getlist('building_blocks')
    building_blocks = []
    try:
        building_blocks = get_building_blocks()
    except Exception:
        log_error('Error fetching building blocks', True)
        flash('Error loading building blocks.', 'danger')
    block_info = get_block_info(building_blocks)
    if len(identifier) > 50:
        flash('Schema name must be at most 50 characters.', 'warning')
    elif not identifier.isalnum():
        flash('Schema name may contain only letters and numbers.', 'warning')
    elif not chosen_blocks:
        flash('At least one building block must be selected.', 'warning')
    else:
        try:
            result = api.call(
                'schema_put_composed_schema',
                data={
                    'identifier': identifier,
                    'description': description,
                    'blocks': chosen_blocks
                }
            )
            if result['status'] == 'ok':
                flash(f"Schema '{identifier}' updated successfully.", 'success')
                return redirect(url_for('schema_composer_bp.index'))
            flash(
                result.get(
                    'message',
                    'Failed to update schema. Please verify the '
                    'building block selections.'
                ),
                'danger'
            )
        except Exception:
            log_error(f"Error updating composed schema '{identifier}'", True)
            flash('An error occurred while updating the schema.', 'danger')
    return render_template(
        'schema_composer.html',
        building_blocks=building_blocks,
        block_info=block_info,
        selected_blocks=chosen_blocks,
        identifier=identifier,
        description=description,
        is_edit=True
    )


@schema_composer_bp.route('/delete/<identifier>', methods=['DELETE'])
@schema_composer_required
def delete(identifier: str) -> Response:
    """Delete a composed schema."""
    try:
        result = api.call('schema_delete_composed_schema', data={'identifier': identifier})
        if result['status'] != 'ok':
            return jsonify({
                'status': 'error',
                'message': result.get('message', 'Failed to delete schema.')
            }), 400
        return jsonify({'status': 'ok', 'message': f"Schema '{identifier}' deleted."})
    except Exception:
        log_error(f"Error deleting composed schema '{identifier}'", True)
        return jsonify({'status': 'error', 'message': 'An error occurred while deleting the schema.'}), 500
