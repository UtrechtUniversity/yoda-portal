import React, { Component } from "react";
import { createRoot } from 'react-dom/client';
import Form from '@rjsf/bootstrap-4';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Ajv2019 from 'ajv/dist/2019';
import { getTemplate } from '@rjsf/utils';
import Select from 'react-select';
import AffiliationIdentifier from 'YodaFields/AffiliationIdentifier'
import Geolocation from 'YodaFields/Geolocation'
import TreeKeywordSelector from 'YodaFields/TreeKeywordSelector'
import PersonIdentifier from 'YodaFields/PersonIdentifier'
import Vocabulary from 'YodaFields/Vocabulary'
import { withTheme } from "@rjsf/core";

const path = document.querySelector('#form').getAttribute('data-path');

let schema       = {};
let uiSchema     = {};
let yodaFormData = {};

let validator;
let formProperties;

let saving = false;
let back   = false;

let form = document.getElementById('form');

const validatorAjvDraft7 = customizeValidator({ ajvOptionsOverrides: {verbose: true, addUsedSchema: false } });
const validatorAjv2019 = customizeValidator({ AjvClass: Ajv2019, ajvOptionsOverrides: {verbose: true, addUsedSchema: false } });

const darkThemeColors = {
    /* For theme color guidance: https://github.com/JedWatson/react-select/issues/3692#issuecomment-523425096 */
    /*
    * control/backgroundColor
    * menu/backgroundColor
    * option/color(selected)
    */
    neutral0: '#212529',

    /*
    * control/backgroundColor(disabled)
    */
    neutral5: '#212529',

    /*
    * control/borderColor(disabled)
    * multiValue/backgroundColor
    * indicators(separator)/backgroundColor(disabled)
    */
    neutral10: '#343a40',

    /*
    * control/borderColor
    * option/color(disabled)
    * indicators/color
    * indicators(separator)/backgroundColor
    * indicators(loading)/color
    */
    neutral20: '#343a40',

    /*
    * control/borderColor(focused)
    * control/borderColor:hover
    */
    neutral30: '#343a40',

    /*
    * input/color
    * multiValue(label)/color
    * singleValue/color
    * indicators/color(focused)
    * indicators/color:hover(focused)
    */
    neutral80: 'var(--neutral-10)',
    neutral90: 'var(--neutral-10)',

    /*
    * One of the few bootstrap variables we can use with theming react-select!
    * control/boxShadow(focused)
    * control/borderColor(focused)
    * control/borderColor:hover(focused)
    * option/backgroundColor(selected)
    * option/backgroundColor:active(selected)
    */
    primary: 'var(--bs-primary)',

    /*
    * option/backgroundColor(focused)
    */
    primary25: '#2b3035',

    /*
    * option/backgroundColor:active
    */
    primary50: '#2b3035',
    primary75: '#2b3035'
}

const enumWidget = (props) => {
    let enumArray = props['schema']['enum'];
    let enumNames = props['schema']['enumNames'];
    let placeholderString = props['uiSchema']['ui:placeholder']

    if (enumNames == null)
        enumNames = enumArray;

    let i = enumArray.indexOf(props['value']);
    let placeholder = enumNames[i] == null ? (placeholderString ? placeholderString : ' ') : enumNames[i];

    let customStyles = {
        control: (styles) => ({
            ...styles,
            border: colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da',
            boxShadow: 'none',
            '&:hover': {
                border: colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da',
            }
        })
    };

    // Check what theme is set
    const colorMode = props.formContext.colorMode

    let required = props.required
    let error = "should be equal to one of the allowed values";

    // Intervene handling of Required attribute as determined by React
    var list = props.id.replace('yoda_', '').split('_');
    var name_hierarchy = [], level_counter = 0, level_name = '', last_was_numeric = false;

    // Determination of actual field name is based on separation of id by numbers (which are introduced by React)
    // Example (first level only) Ancillary_Equipment_0
    // Example 2: Contact_0_Person_Identifier_Scheme consists of 2 fields
    // This way an array can be constructed listing the hierarchy of names leading up the id of the field
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
    // Therefore, do it now explicitly
    if (!last_was_numeric) {
        name_hierarchy[level_counter] = level_name;
    }

    // Only perform a correction for highest level select fields (i.e. length == 1)
    if (name_hierarchy.length == 1) {
        // Determine actual value for required from top level required list within the jsonschema
        required = formProperties.data.schema.required.includes(name_hierarchy[0]);
    }

    // will hold classes (select-required, select-filled) as indications for totalization purposes.
    // For that purpose element <selectTotals> will be added.
    let selectCompletenessClasses = '';

    if((props.rawErrors !== undefined && props.rawErrors.indexOf(error) >= 0) || (required && props.value == null)) {
        // Indicate that this element is required and should be counted as total
        selectCompletenessClasses = 'select-required';
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
        // Indicate that this element is required and holds a value
        selectCompletenessClasses = 'select-required select-filled';
    }

    return (
        <div>
            <selectTotals class={selectCompletenessClasses}></selectTotals>
            <Select className={'select-box'}
                    placeholder={placeholder}
                    required={required}
                    isDisabled={props.readonly}
                    onChange={(event) => props.onChange(event.value)}
                    options={props['options']['enumOptions']}
                    styles={customStyles}
                    theme={(theme) => ({
                        ...theme,
                        colors: (colorMode === 'dark') ? {...theme.colors, ...props.formContext.darkThemeColors} : {...theme.colors},
                    })}
            />
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
    person_identifier: PersonIdentifier,
    tree_keyword_selector: TreeKeywordSelector
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
                                            <button className="btn btn-outline-secondary btn-sm" type="button" tabindex="-1"
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
                                            <button className="btn btn-outline-secondary btn-sm" type="button" tabindex="-1"
                                                    onClick={el.onReorderClick(
                                                        el.index,
                                                        el.index + 1
                                                    )}>
                                                <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    )}

                                    {el.hasRemove && props.items.length > 1 && (
                                        <div className="m-0 p-0">
                                            <button className="btn btn-outline-secondary btn-sm" type="button" tabindex="-1"
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

const onSubmit = ({ formData }) => submitData(formData)

class YodaForm extends React.Component {
    constructor (props) {
        super(props)

        const formContext = {
            saving: false,
            colorMode: document.documentElement.getAttribute('data-bs-theme'),
            darkThemeColors: darkThemeColors
        }

        this.state = {
            formData: yodaFormData,
            formContext: formContext
        }
    }

    onChange(form, id) {
        let formContext = {...this.state.formContext};
        // Turn save mode off.
        formContext.saving = false;

        // Update TreeKeyword field if it exists and was the one changed
        if (id === "yoda_TreeKeyword" &&
            form.formData.TreeKeyword &&
            form.formData.TreeKeyword.value &&
            form.formData.TreeKeyword.value.length &&
            Object.keys(form.schema.properties.TreeKeyword.items.properties).includes("subject")) {

            form.formData.TreeKeyword = this.updateTreeKeywords(form, form.formData.TreeKeyword.value)
        }

        this.setState({
            formData: form.formData,
            formContext: formContext
        });
    }

    updateTreeKeywords = (form, value) => {
        const newVal = value.map(val => {
            if (val.value.endsWith(":")) {
                // User created keyword
                return {
                    "subject": val.label,
                }
            } else {
                return {
                    "subject": val.label,
                    "subjectScheme": form.uiSchema.TreeKeyword["ui:subjectScheme"],
                    "schemeUri": "ui:schemeUri" in form.uiSchema.TreeKeyword ?
                        form.uiSchema.TreeKeyword["ui:schemeUri"] :
                        val.value.split(":").slice(1).join(":").split("/").slice(0,-1).join("/") + "/",
                    "valueUri": val.value.split(":").slice(1).join(":")
                }
            }
        })
        return newVal
    }

    onError(form) {
        let formContext = {...this.state.formContext};
        formContext.saving = saving;
        this.setState({ formContext: formContext });
    }

    transformErrors(errors) {
        // Strip errors when saving.
        if (saving) {
            return errors.filter((e) => e.name !== 'required' && e.name !== 'dependencies' && e.name !== 'enum' && e.name !== 'type');
        }
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
                  omitExtraData={true}
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

    renderBackButton() {
        return (<button onClick={this.props.backButton} type="submit" className="btn btn-secondary float-start btn-step-upload"><i class="fa-solid fa-chevron-left"></i> Upload data</button>);
    }

    renderSubmitButton() {
        return (<button onClick={this.props.submitButton} type="submit" className="btn btn-primary float-end btn-step-submit">Submit datapackage <i class="fa-solid fa-chevron-right"></i></button>);
    }

    renderDeleteButton() {
        return (<button onClick={deleteMetadata} type="button" className="btn btn-secondary delete-all-metadata-btn ms-3">Delete all metadata </button>);
    }

    renderButtons() {
        let buttons = [];

        if (formProperties.data.can_edit) {
            buttons.push(this.renderBackButton());
            buttons.push(this.renderSubmitButton());
            if (formProperties.data.metadata !== null)
                buttons.push(this.renderDeleteButton());
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
        this.backButton = this.backButton.bind(this);
        this.submitButton = this.submitButton.bind(this);
    }

    backButton() {
        back = true;
        saving = true;
        this.form.submitButton.click();
    }

    submitButton() {
        back = false;
        saving = true;
        this.form.submitButton.click();
    }

    render() {
        return (
            <div>
                <YodaButtons backButton={this.backButton}
                             submitButton={this.submitButton}
                             deleteMetadata={deleteMetadata}  />
                <YodaForm ref={(form) => {this.form=form;}}/>
                <YodaButtons backButton={this.backButton}
                             submitButton={this.submitButton}
                             deleteMetadata={deleteMetadata} />
            </div>
        );
    }
};


function deleteMetadata() {
    swal({
            title: "Are you sure?",
            text: "You will not be able to undo this action.",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete all metadata!",
            closeOnConfirm: false,
            animation: false
        },
        async isConfirm => {
            if (isConfirm) {
                await Yoda.call('meta_remove',
                    {coll: Yoda.basePath+path},
                    {errorPrefix: 'Metadata could not be deleted'});

                Yoda.store_message('success', `Deleted metadata of folder <${path}>`);
                browse();
            }
        });
}

function loadForm() {
    document.querySelector('.link-step-upload').addEventListener('click', function() {
        document.querySelector('.btn-step-upload').click();
    });
    document.querySelector('.link-step-submit').addEventListener('click', function() {
        document.querySelector('.btn-step-submit').click();
    });

    Yoda.call('meta_form_load',
        {coll: Yoda.basePath+path},
        {rawResult: true})
        .then((data) => {
            formProperties = data;

            if (formProperties.data !== null) {
                // These are only present when there is a form to show (i.e. no
                // validation errors, and no transformation needed).
                schema       = formProperties.data.schema;
                uiSchema     = formProperties.data.uischema;
                yodaFormData = formProperties.data.metadata === null ? undefined : formProperties.data.metadata;
            }

            if (formProperties.status === 'error_transformation_needed') {
                // Transformation is necessary. Show transformation prompt.
                document.getElementById('transformation-text').innerHTML = formProperties.data.transformation_html;

                if (formProperties.data.can_edit) {
                    document.getElementById('transformation-buttons').classList.remove('hide');
                    document.getElementById('transformation-text').innerHTML = formProperties.data.transformation_html;
                } else {
                    document.querySelector('#transformation .close-button').classList.remove('hide');
                }

                document.querySelectorAll('.transformation-accept').forEach(button => {
                    button.addEventListener('click', async () => {
                        button.setAttribute('disabled', true);
                        await Yoda.call('transform_metadata', {
                            coll: `${Yoda.basePath}${path}`,
                            keep_metadata_backup: document.getElementById('cb-keep-metadata-backup').checked
                        }, { errorPrefix: 'Metadata could not be transformed' });

                        window.location.reload();
                    });
                });

                document.getElementById('transformation').classList.remove('hide');

            } else if (formProperties.status !== 'ok') {
                // Errors exist - show those instead of loading a form.
                let text = '';
                if (formProperties.status === 'error_validation') {
                    // Validation errors? Show a list.
                    Object.entries(formProperties.data.errors).forEach(([key, field]) => {
                        text += `<li>${document.createElement('div').appendChild(document.createTextNode(field.replace('->', '→'))).innerHTML}</li>`;
                    });
                } else {
                    // Structural / misc error? Show status info.
                    text += `<li>${document.createElement('div').appendChild(document.createTextNode(formProperties.status_info)).innerHTML}</li>`;
                }

                document.querySelector('.delete-all-metadata-btn').addEventListener('click', deleteMetadata);
                document.querySelector('#form-errors .error-fields').innerHTML = text;
                document.getElementById('form-errors').classList.remove('hide');

            } else if (formProperties.data.metadata === null && !formProperties.data.can_edit) {
                // No metadata present and no write access. Do not show a form.
                document.getElementById('metadata-form').classList.remove('hide');
                document.getElementById('form').classList.add('hide');

                if (formProperties.data.is_locked) {
                    document.getElementById('no-metadata-and-locked').classList.remove('hide');
                } else {
                    document.getElementById('no-metadata').classList.remove('hide');
                }

            } else {
                // Select validator based on schema.
                validator = validatorAjv2019
                if (schema.$schema == "http://json-schema.org/draft-07/schema") {
                    validator = validatorAjvDraft7
                }

                // Metadata present or user has write access, load the form.
                if (!formProperties.data.can_edit) {
                    uiSchema['ui:readonly'] = true;
                }

                const root = createRoot(document.getElementById('form'));
                root.render(<Container />);

                // Form may already be visible (with "loading" text).
                if (document.getElementById('metadata-form').classList.contains('hide')) {
                    // Avoid flashing things on screen.
                    document.getElementById('metadata-form').classList.remove('hide');
                }

                // If maintenance banner is visible, add padding to metadata form header
                if (document.getElementById('maintenance-banner') || document.querySelector('.non-production')) {
                    const cardHeader = document.querySelector('#metadata-form .card-header');
                    cardHeader.classList.add('pt-4', 'pb-3');
                    cardHeader.style.top = '0.5rem';
                }

                // Specific required textarea handling
                document.querySelectorAll('textarea[required]').forEach(textarea => {
                    // Initial setting when form is opened
                    if (textarea.value === '') {
                        textarea.classList.add('is-invalid');
                    }

                    // Following changes in the required textarea and adjust border status
                    textarea.addEventListener("change", validateTextarea);
                    textarea.addEventListener("keyup", validateTextarea);
                    textarea.addEventListener("paste", validateTextarea);
                });

                function validateTextarea(e) {
                    if (e.target.value === '') {
                        e.target.classList.add('is-invalid');
                    } else {
                        e.target.classList.remove('is-invalid');
                    }
                }
            }
        });
}

window.onload = () => loadForm();

async function submitData(data) {
    // Disable buttons.
    const buttons = document.querySelectorAll('.yodaButtons button');
    buttons.forEach(button => button.disabled = true);

    // Remove empty arrays and array items when saving.
    for (const property in data) {
        if (Array.isArray(data[property])) {
            const unfiltered = data[property];
            const filtered = unfiltered.filter(e => e);

            if (filtered.length === 0) {
                delete data[property];
            } else {
                data[property] = filtered;
            }
        }
    }

    // Save.
    try {
        await Yoda.call('meta_form_save',
            { coll: `${Yoda.basePath}${path}`, metadata: data },
            { errorPrefix: 'Metadata could not be saved' });

        if (back) {
            window.location.href = '/deposit/data?dir=' + path;
        } else {
            window.location.href = '/deposit/submit?dir=' + path;
        }
    } catch (e) {
        // Allow retry.
        buttons.forEach(button => button.disabled = false)
    }
}
