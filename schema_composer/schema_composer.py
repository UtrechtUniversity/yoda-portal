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
    make_response,
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
    block_info = {}
    for block in building_blocks:
        for block_name, block_data in block.items():
            schema = block_data.get('schema', {})
            block_info[block_name] = {
                'title': schema.get('title', ''),
                'description': schema.get('description', ''),
            }
    return block_info


@schema_composer_bp.route('/')
@schema_composer_required
def index() -> Response:
    """Schema Composer overview page."""
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
        flash('Error while loading schemas.', 'danger')
        return render_template(
            'overview.html',
            composed_schemas=[],
            building_blocks=[],
            block_info={}
        )


@schema_composer_bp.route('/compose', methods=['GET'])
@schema_composer_required
def compose_create_get() -> Response:
    """Get building-blocks to create a new composed schema."""
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
        schema_name='',
        description='',
        is_edit=False
    )


@schema_composer_bp.route('/compose', methods=['POST'])
@schema_composer_required
def compose_create_post() -> Response:
    """Create new composed schema."""
    identifier = request.form.get('identifier', '')
    schema_name = request.form.get('schema_name', '')
    description = request.form.get('description', '')
    chosen_blocks = request.form.getlist('building_blocks')

    try:
        building_blocks = get_building_blocks()
    except Exception:
        log_error('Error fetching building blocks', True)
        flash('Error loading building blocks.', 'danger')
    block_info = get_block_info(building_blocks)

    if not identifier:
        flash('Schema identifier is required.', 'warning')
    elif len(identifier) > 50:
        flash('Schema identifier must be at most 50 characters.', 'warning')
    elif not identifier.isalnum():
        flash('Schema identifier may contain only letters and numbers.', 'warning')
    elif not schema_name:
        flash('Schema name is required.', 'warning')
    elif not chosen_blocks:
        flash('At least one building block must be selected.', 'warning')
    else:
        try:
            result = api.call('schema_get_composed_schemas')
            if isinstance(result, dict):
                composed_schemas = result.get('data', result)
                if any(schema.get('identifier') == identifier for schema in composed_schemas):
                    flash(f"Schema identifier '{identifier}' already exists.", 'warning')
                    return render_template(
                        'schema_composer.html',
                        building_blocks=building_blocks,
                        block_info=block_info,
                        selected_blocks=chosen_blocks,
                        identifier=identifier,
                        schema_name=schema_name,
                        description=description,
                        is_edit=False
                    )
            result = api.call(
                'schema_post_composed_schema',
                data={
                    'identifier': identifier,
                    'name': schema_name,
                    'description': description,
                    'blocks': chosen_blocks
                }
            )
            if result['status'] == 'ok':
                flash(f"Schema '{schema_name}' saved successfully.", 'success')
                return redirect(url_for('schema_composer_bp.index'))
            flash(result.get('message', 'Failed to save schema'), 'danger')
        except Exception:
            log_error(f"Error creating composed schema '{schema_name}'", True)
            flash('An error occurred while saving the schema.', 'danger')
    return render_template(
        'schema_composer.html',
        building_blocks=building_blocks,
        block_info=block_info,
        selected_blocks=chosen_blocks,
        identifier=identifier,
        schema_name=schema_name,
        description=description,
        is_edit=False
    )


@schema_composer_bp.route('/compose/<identifier>', methods=['GET'])
@schema_composer_required
def compose_edit_get(identifier: str) -> Response:
    """Get pre-selected building blocks for an existing schema for editing."""
    selected_blocks = []
    schema_name = ''
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
                schema_name = data.get('name', '')
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
        schema_name=schema_name,
        description=description,
        is_edit=True
    )


@schema_composer_bp.route('/compose/<identifier>', methods=['POST'])
@schema_composer_required
def compose_edit_post(identifier: str) -> Response:
    """Updating an existing composed schema."""
    schema_name = request.form.get('schema_name', '')
    description = request.form.get('description', '')
    chosen_blocks = request.form.getlist('building_blocks')

    try:
        building_blocks = get_building_blocks()
    except Exception:
        log_error('Error fetching building blocks', True)
        flash('Error loading building blocks.', 'danger')

    block_info = get_block_info(building_blocks)
    # The same checks as in API
    if len(identifier) > 50:
        flash('Schema identifier must be at most 50 characters.', 'warning')
    elif not identifier.isalnum():
        flash('Schema identifier may contain only letters and numbers.', 'warning')
    elif not schema_name:
        flash('Schema name is required.', 'warning')
    elif not chosen_blocks:
        flash('At least one building block must be selected.', 'warning')
    else:
        try:
            result = api.call(
                'schema_put_composed_schema',
                data={
                    'identifier': identifier,
                    'name': schema_name,
                    'description': description,
                    'blocks': chosen_blocks
                }
            )
            if result['status'] == 'ok':
                flash(f"Schema '{identifier}' updated successfully.", 'success')
                return redirect(url_for('schema_composer_bp.index'))
            flash(result.get('message', 'Failed to update schema'), 'danger')
        except Exception:
            log_error(f"Error updating composed schema '{identifier}'", True)
            flash('An error occurred while updating the schema.', 'danger')
    return render_template(
        'schema_composer.html',
        building_blocks=building_blocks,
        block_info=block_info,
        selected_blocks=chosen_blocks,
        identifier=identifier,
        schema_name=schema_name,
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
            response = make_response(jsonify({
                'status': 'error',
                'message': result.get('message', 'Failed to delete schema.')
            }), 400)
            response.headers['Content-Type'] = 'application/json'
            return response
        return jsonify({'status': 'ok', 'message': f"Schema '{identifier}' deleted."})
    except Exception:
        log_error(f"Error deleting composed schema '{identifier}'", True)
        response = make_response(jsonify({
            'status': 'error',
            'message': 'An error occurred while deleting the schema.'
        }), 500)
        response.headers['Content-Type'] = 'application/json'
        return response


@schema_composer_bp.route('/preview/<block_name>')
@schema_composer_required
def preview(block_name: str) -> Response:
    """Preview a building block schema."""
    building_blocks = []
    try:
        building_blocks = get_building_blocks()
    except Exception:
        log_error('Error fetching building blocks', True)
        flash('Error loading building blocks.', 'danger')

    for block in building_blocks:
        if block_name in block:
            block_data = block[block_name]
            return render_template(
                'preview.html',
                schema_name=block_name,
                schema=block_data.get('schema', {}),
                uischema=block_data.get('ui_schema', {})
            )

    return render_template(
        'preview.html',
        schema_name=block_name,
        schema={},
        uischema={}
    )
