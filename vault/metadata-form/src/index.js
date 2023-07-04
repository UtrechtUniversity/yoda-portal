import React, { Component } from "react";
import { render } from "react-dom";
import Form from "@rjsf/bootstrap-4";
import validator from '@rjsf/validator-ajv8';
import { getTemplate } from '@rjsf/utils';
import Select from 'react-select';
import Geolocation from "./Geolocation";
import Vocabulary from "./Vocabulary";
import AffiliationIdentifier from  "./AffiliationIdentifier";
import PersonIdentifier from "./PersonIdentifier";


const path = $('#form').attr('data-path');

let schema       = {};
let uiSchema     = {};
let yodaFormData = {};

let actual_edit_mode = false; // if can edit, it is not diretly shown.
let formProperties;

let saving = false;

let form = document.getElementById('form');

const enumWidget = (props) => {
    let enumArray = props['schema']['enum'];
    let enumNames = props['schema']['enumNames'];

    if (enumNames == null)
        enumNames = enumArray;

    let i = enumArray.indexOf(props['value']);
    let placeholder = enumNames[i] == null ? ' ' : enumNames[i];

    let title = props.label || props.uiSchema["ui:title"]
    let label = <label className="form-label">{title}</label>
    let customStyles = {
        control: styles => ({
            ...styles,
            border: '1px solid #ced4da',
            boxShadow: 'none',
            '&:hover': {
                border: '1px solid #ced4da',
            }
        })
    };
    let required = props.required
    let error = "should be equal to one of the allowed values";

    // Intervene handling of Required attribute as determined by React
    var list = props.id.replace('yoda_', '').split('_');
    var name_hierarchy = [], level_counter = 0, level_name = '', last_was_numeric = false;

    // Determination of actual field name is based on seperation of id by numbers (which are introduced by React)
    // Example (first level only) Ancillary_Equipment_0
    // Example 2: Contact_0_Person_Identifier_Scheme consists of 2 fields
    // This way an array can be constructed listing the hierachy of names leading up the id of the field
    list.forEach(function (item, index) {
        if (isNaN(item)) {
            last_was_numeric = false;
            level_name = level_name + ((level_name.length) ? '_' : '') + item;
        } else {
            last_was_numeric = true;
            name_hierarchy[level_counter] = level_name;
            level_counter++;
            level_name = '';
         }
    });

    // If the final item was not numeric, it is not yet added to the name_hierarchy array
    // Therefore, do it now explicitely
    if (!last_was_numeric) {
        name_hierarchy[level_counter] = level_name;
    }

    // Only perform a correction for highest level select fields (i.e. length == 1)
    if (name_hierarchy.length == 1) {
        // Determine actual value for required from top level required list within the jsonschema
        required = formProperties.data.schema.required.includes(name_hierarchy[0]);
    }

    if((props.rawErrors !== undefined && props.rawErrors.indexOf(error) >= 0) || (required && props.value == null)) {
        label = <label className="text-danger form-label select-required">{title}*</label>
        customStyles = {
            control: styles => ({
                ...styles,
                border: '1px solid #dc3545',
                boxShadow: 'none',
                '&:hover': {
                    border: '1px solid #dc3545',
                }
            })
        };
    } else if (required) {
        label = <label className="form-label select-required select-filled">{title}*</label>
    }

    return (
        <div>
            <Select className={'select-box'}
                    placeholder={placeholder}
                    required={required}
                    isDisabled={props.readonly}
                    onChange={(event) => props.onChange(event.value)}
                    options={props['options']['enumOptions']}
                    styles={customStyles} />
        </div>
    );
};

const widgets = {
    SelectWidget: enumWidget
};

const fields = {
    geo: Geolocation,
    vocabulary: Vocabulary,
    affiliation_identifier: AffiliationIdentifier,
    person_identifier: PersonIdentifier
};

const CustomArrayFieldTemplate = (props) => {
    const { readonly, disabled } = props;

    if (disabled) {
        let output = props.items.map((element, i) => {
            // Disabled view
            if (disabled) {
                return element.children;
            }
        });
        return (<div className="hide">{output}</div>);
    } else {
        let buttonClass = "col-sm-2 offset-sm-10 array-item-add text-right";
        if (props.uiSchema["ui:description"] || props.schema.description) {
            buttonClass = "col-sm-2 array-item-add text-right";
        }

        return (
            <fieldset className="yoda-array-field border rounded mb-4">
                {(props.title) && (
                    <legend>{props.title}</legend>
                )}

                <div className="d-flex">
                    {(props.uiSchema["ui:description"] || props.schema.description) && (
                        <small className="col-sm-10 text-muted form-text mb-2">
                            {props.uiSchema["ui:description"] || props.schema.description}
                        </small>
                    )}

                    {(!readonly && props.canAdd) && (
                        <p className={buttonClass}>
                            <button className="btn btn-outline-secondary btn-sm" onClick={props.onAddClick} type="button">
                                <i className="fa-solid fa-plus" aria-hidden="true"></i>
                            </button>
                        </p>
                    )}
                </div>

                {props.items &&
                props.items.map(el => (
                    <div key={el.key} className="d-flex">
                        <div className="col-lg-10 col-10">
                            {el.children}
                        </div>
                        {!readonly && (
                            <div className="py-4 col-lg-2 col-2 mt-2">
                                <div className="d-flex flex-row">
                                    {el.hasMoveUp && (
                                        <div className="m-0 p-0">
                                            <button className="btn btn-light btn-sm" type="button" tabindex="-1"
                                                    onClick={el.onReorderClick(
                                                        el.index,
                                                        el.index - 1
                                                    )}>
                                                <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    )}

                                    {el.hasMoveDown && (
                                        <div className="m-0 p-0">
                                            <button className="btn btn-light btn-sm" type="button" tabindex="-1"
                                                    onClick={el.onReorderClick(
                                                        el.index,
                                                        el.index + 1
                                                    )}>
                                                <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    )}

                                    {el.hasRemove && (
                                        <div className="m-0 p-0">
                                            <button className="btn btn-light btn-sm" type="button" tabindex="-1"
                                                    onClick={el.onDropIndexClick(el.index)}>
                                                <i className="fa-solid fa-trash" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </fieldset>
        );
    }
};

const CustomFieldTemplate = (props) => {
    const {id, classNames, style, label, help, hidden, required, description, errors,
        rawErrors, children, displayLabel, formContext, readonly} = props;

    let labelClass = '';
    if (Array.isArray(rawErrors)) {
        labelClass = 'text-danger';
    }


    if (hidden || !displayLabel) {
        return children;
    }

    // Only show error messages after submit.
    if (formContext.saving) {
        return (
            <div className={classNames + ' row'}>
                <div className={'col-12 field-wrapper'}>
                    <div className={'form-group mb-0'}>
                        <div className={'mb-0 form-group'}>
                            <label htmlFor={id} className={labelClass}>
                                {label}
                                {required ? '*' : null}
                            </label>
                            {children}
                            {help && (
                                <small className="text-muted form-text">{help}</small>
                            )}
                            {description}
                        </div>
                    </div>
                    {errors}
                </div>
            </div>
        );
    } else {
        return (
            <div className={classNames+ ' row'}>
                <div className={'col-12 field-wrapper'}>
                    <div className={'form-group mb-0'}>
                        <div className={'mb-0 form-group'}>
                            <label htmlFor={id} className={labelClass}>
                                {label}
                                {required ? '*' : null}
                            </label>
                            {children}
                            {help && (
                                <small className="text-muted form-text">{help}</small>
                            )}
                            {description}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

const CustomObjectFieldTemplate = (props) => {
    const { registry, uiOptions } = props;
    const TitleField = getTemplate("TitleFieldTemplate", registry, uiOptions);
    let structureClass;
    let structure;
    if ('yoda:structure' in props.schema) {
        structureClass = `yoda-structure ${props.schema['yoda:structure']}`;
        structure = props.schema['yoda:structure'];
    }

    if (structure === 'compound') {
        let output = props.properties.map((prop, i) => {
            return (
                <div key={i} className="col compound-field">
                    {prop.content}
                </div>
            );
        });

        if(props.title) {
            return (
                <fieldset className="yoda-array-field border rounded mb-4">
                    <legend>{props.title}</legend>
                    <div className="d-flex">{output} </div>
                </fieldset>
            );
        } else {
            return (
                <div className="d-flex">{output}</div>
            );
        }
    }

    return (
        <fieldset className="mb-3">
            {(props.uiSchema["ui:description"] || props.schema.description) && (
                <small className="col-xs-12 text-muted form-text">
                    {props.uiSchema["ui:description"] || props.schema.description}
                </small>
            )}
            <div className="container-fluid p-0">
                {props.properties.map(prop => (
                    <div className="col-xs-12" key={prop.content.key}>
                        {prop.content}
                    </div>
                ))}
            </div>
        </fieldset>
    );
};

const CustomErrorListTemplate = (props) => {
    let {errors, formContext} = props;
    errors = errors.filter((e) => e.name !== 'required' && e.name !== 'dependencies');

    if (errors.length === 0) {
        return(<div></div>);
    } else {
        // Show error list only on save.
        if (formContext.saving) {
            return (
                <div className="mb-4 card border-danger">
                    <div className="alert-danger card-header">Validation warnings</div>
                    <div className="p-0 card-body">
                        <div className="list-group">
                            {errors.map((error, i) => {
                                return (
                                    <div key={i} className="border-0 list-group-item">
                                        <span>{error.stack}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        } else {
            return(<div></div>);
        }
    }
};

const templates = {
    ArrayFieldTemplate: CustomArrayFieldTemplate,
    ObjectFieldTemplate: CustomObjectFieldTemplate,
    ErrorListTemplate: CustomErrorListTemplate,
    FieldTemplate: CustomFieldTemplate
};

const onSubmit = ({formData}) => submitData(formData);

class YodaForm extends React.Component {
    constructor(props) {
        super(props);

        const formContext = {
            saving: false
        };
        this.state = {
            formData: yodaFormData,
            formContext: formContext
        };
    }

    onChange(form) {
        updateCompleteness();

        // Turn save mode off.
        saving = false;
        const formContext = { saving: false };

        this.setState({
            formData: form.formData,
            formContext: formContext
        });
    }

    onError(form) {
        let formContext = {...this.state.formContext};
        formContext.saving = saving;
        this.setState({ formContext: formContext });
    }

    transformErrors(errors) {
        // Strip errors when saving.
        if (saving)
            return errors.filter((e) => e.name !== 'required' && e.name !== 'dependencies');
        return errors;
    }

    render () {
        return (
            <Form className="metadata-form"
                  schema={schema}
                  idPrefix={"yoda"}
                  uiSchema={uiSchema}
                  fields={fields}
                  formData={this.state.formData}
                  formContext={this.state.formContext}
                  liveValidate={true}
                  noValidate={false}
                  noHtml5Validate={true}
                  showErrorList={"top"}
                  widgets={widgets}
                  templates={templates}
                  onSubmit={onSubmit}
                  onChange={this.onChange.bind(this)}
                  onError={this.onError.bind(this)}
                  transformErrors={this.transformErrors}
                  validator={validator}>
                <button ref={(btn) => {this.submitButton=btn;}} className="hidden" />
            </Form>
        );
    }
}

class YodaButtons extends React.Component {
    constructor(props) {
        super(props);
    }

    renderSaveButton() {
        return (<button onClick={this.props.saveMetadata} type="submit" className="btn btn-primary">Save</button>);
    }

    renderUpdateButton() {
        return (<button onClick={this.props.updateMetadata} type="button" className="btn btn-primary">Update metadata</button>);
    }

    renderFormCompleteness() {
        return (<div><span className="text-sm float-start text-muted text-center ms-3 mt-1">Required for the vault:</span><div className="form-completeness progress float-start ms-3 mt-2 w-25" data-bs-toggle="tooltip" title=""><div className="progress-bar bg-success"></div></div></div>);
    }

    renderButtons() {
        let buttons = [];

        if (formProperties.data.can_edit) {
            if (!actual_edit_mode) {
                buttons.push(this.renderUpdateButton());
            } else {
                buttons.push(this.renderSaveButton());
                buttons.push(this.renderFormCompleteness());
            }
        }
        return (<div>{buttons}</div>);
    }

    render() {
        return (
            <div className="form-group">
                <div className="row yodaButtons">
                    <div className="col-sm-12">
                        {this.renderButtons()}
                    </div>
                </div>
            </div>
        );
    }
}

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.saveMetadata = this.saveMetadata.bind(this);
    }

    saveMetadata() {
        saving = true;
        this.form.submitButton.click();
    }

    updateMetadata() {
        actual_edit_mode = true;
        $(_ => loadForm());
    }

    render() {
        return (
            <div>
                <YodaButtons saveMetadata={this.saveMetadata}
                             updateMetadata={this.updateMetadata} />
                <YodaForm ref={(form) => {this.form=form;}}/>
                <YodaButtons saveMetadata={this.saveMetadata}
                             updateMetadata={this.updateMetadata} />
            </div>
        );
    }
};

/**
 * Returns to the browse view for the current collection.
 */
function browse() {
    window.location.href = '/vault/browse?dir=' + encodeURIComponent(path);
}


function loadForm() {
    Yoda.call('meta_form_load',
        {coll: Yoda.basePath+path},
        {rawResult: true})
    .then((data) => {
        formProperties = data;
        formLoaded = true;

        if (formProperties.data !== null) {
            // These ary only present when there is a form to show (i.e. no
            // validation errors, and no transformation needed).
            schema = formProperties.data.schema;
            uiSchema = formProperties.data.uischema;
            yodaFormData = formProperties.data.metadata === null ? undefined : formProperties.data.metadata;
        }

        if (formProperties.status === 'error_transformation_needed') {
            // Transformation is necessary. Show transformation prompt.
            $('#transformation-text').html(formProperties.data.transformation_html);
            if (formProperties.data.can_edit) {
                $('#transformation-buttons').removeClass('hide')
                $('#transformation-text').html(formProperties.data.transformation_html);
            } else {
                $('#transformation .close-button').removeClass('hide')
            }
            $('.transformation-accept').on('click', async () => {
                $('.transformation-accept').attr('disabled', true);

                await Yoda.call('transform_metadata',
                    {coll: Yoda.basePath + path},
                    {errorPrefix: 'Metadata could not be transformed'});

                window.location.reload();
            });
            $('#transformation').removeClass('hide');

        } else if (formProperties.status !== 'ok') {
            // Errors exist - show those instead of loading a form.
            let text = '';
            if (formProperties.status === 'error_validation') {
                // Validation errors? show a list.
                $.each(formProperties.data.errors, (key, field) => {
                    text += '<li>' + $('<div>').text(field.replace('->', '→')).html();
                });
            } else {
                // Structural / misc error? Show status info.
                text += '<li>' + $('<div>').text(formProperties.status_info).html();
            }
            // HdR The delete button does not exist in vault
            //$('.delete-all-metadata-btn').on('click', deleteMetadata);
            $('#form-errors .error-fields').html(text);
            $('#form-errors').removeClass('hide');

        } else if (formProperties.data.metadata === null && !formProperties.data.can_edit) {
            // No metadata present and no write access. Do not show a form.
            $('#form').addClass('hide');
            $('#no-metadata').removeClass('hide');

        } else {
            // Metadata present or user has write access, load the form and must be in actual_edit_mode as chosen by user
            if (formProperties.data.can_edit && actual_edit_mode) {
                uiSchema = formProperties.data.uischema; // take over original ui-shema again- not the readonly one

                $(".form-completeness .progress-bar").css('width', '100%');
            } else {
                uiSchema['ui:readonly'] = true;
            }

            render(<Container/>, document.getElementById('form'));

            // Form may already be visible (with "loading" text).
            if ($('#metadata-form').hasClass('hide')) {
                // Avoid flashing things on screen.
                $('#metadata-form').fadeIn(220);
                $('#metadata-form').removeClass('hide');
            }

            // Specific required textarea handling
            $('textarea').each(function() {
                if ($(this).attr('required')) {
                    // initial setting when form is opened
                    if ($(this).val()=='') {
                        $(this).addClass('is-invalid');
                    }
                    // following changes in the required textarea and adjust border status
                    $(this).on("change keyup paste", function() {
                        if ($(this).val()=='') {
                            if (!$(this).hasClass('is-invalid')) {
                                $(this).addClass('is-invalid');
                            }
                        }
                        else {
                            $(this).removeClass('is-invalid');
                        }
                    });
                }
            })

            updateCompleteness();
        }
    });
}

$(_ => loadForm());

async function submitData(data) {
    // Disable buttons.
    $('.yodaButtons button').attr('disabled', true);

    // Save.
    try {
        await Yoda.call('meta_form_save',
            {coll: Yoda.basePath+path, metadata: data},
            {errorPrefix: 'Metadata could not be saved'});

        Yoda.store_message('success', `Updated metadata of folder <${path}>`);
        browse();
    } catch (e) {
        // Allow retry.
        $('.yodaButtons button').attr('disabled', false);
    }
}

function updateCompleteness()
{
    let mandatoryTotal = 0;
    let mandatoryFilled = 0;
    $(".form-control").each(function() {
        if ($(this)[0].required && !$(this)[0].id.startsWith("yoda_links_")) {
            mandatoryTotal++;
            if ($(this)[0].value != "") {
                mandatoryFilled++;
            }
        }
    });

    $(".select-required").each(function() {
        mandatoryTotal++;
    });
    $(".select-filled").each(function() {
        mandatoryFilled++;
    });

    let percent = (mandatoryFilled / mandatoryTotal) * 100;
    $(".form-completeness .progress-bar").css('width', percent + '%');
    $('.form-completeness').attr('title', `Required for the vault: ${mandatoryTotal}, currently filled required fields: ${mandatoryFilled}`);

    return mandatoryTotal == mandatoryFilled;
}
