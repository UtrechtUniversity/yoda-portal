import React, { Component } from "react";
import { render } from "react-dom";
import Form from '@rjsf/bootstrap-4';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Ajv2019 from 'ajv/dist/2019';
import { getTemplate } from '@rjsf/utils';
import Select from 'react-select';
import Geolocation from "./Geolocation";
import Vocabulary from "./Vocabulary";
import AffiliationIdentifier from  "./AffiliationIdentifier";
import PersonIdentifier from "./PersonIdentifier";
import { withTheme } from "@rjsf/core";


const path = $('#form').attr('data-path');

let schema       = {};
let uiSchema     = {};
let yodaFormData = {};

let validator;
let formProperties;

let saving = false;

let form = document.getElementById('form');

const validatorAjvDraft7 = customizeValidator({ ajvOptionsOverrides: {verbose: true, addUsedSchema: false } });
const validatorAjv2019 = customizeValidator({ AjvClass: Ajv2019, ajvOptionsOverrides: {verbose: true, addUsedSchema: false } });

const enumWidget = (props) => {
    let enumArray = props['schema']['enum'];
    let enumNames = props['schema']['enumNames'];

    if (enumNames == null)
        enumNames = enumArray;

    let i = enumArray.indexOf(props['value']);
    let placeholder = enumNames[i] == null ? ' ' : enumNames[i];

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
          * One of the few bootstrap variables we can use with themeing react-select!
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
        primary75: '#2b3035',
    };

    // Check what theme is set
    const colorMode = document.documentElement.getAttribute('data-bs-theme');

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
        required = schema.required.includes(name_hierarchy[0]);
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
                        colors: (colorMode === 'dark') ? {...theme.colors, ...darkThemeColors} : {...theme.colors},
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

    renderUploadButton() {
        return (<button onClick={this.props.uploadMetadata} type="submit" className="btn btn-primary float-start">Upload</button>);
    }

    renderDownloadButton() {
        return (<button onClick={this.props.downloadMetadata} type="submit" className="btn btn-primary float-start ms-3">Download</button>);
    }

    renderFormCompleteness() {
        return (<div><span className="text-sm float-start text-muted text-center ms-3 mt-1">Required for the vault:</span><div className="form-completeness progress float-start ms-3 mt-2 w-25" data-bs-toggle="tooltip" title=""><div className="progress-bar bg-success"></div></div></div>);
    }

    renderButtons() {
        let buttons = [];

        buttons.push(this.renderUploadButton());
        buttons.push(this.renderDownloadButton());
        buttons.push(this.renderFormCompleteness());

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
        this.uploadMetadata = this.uploadMetadata.bind(this);
        this.downloadMetadata = this.downloadMetadata.bind(this);
    }

    uploadMetadata() {
        // Create file input.
        let file_input = document.createElement('input');
        file_input.type = 'file';
        let metadata = {};

        // Retrieve file when file is selected.
        file_input.onchange = _ => {
            let file = file_input.files[0];
            var that = this;

            // Read Yoda metadata file.
            let reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function() {
                metadata = JSON.parse(reader.result);
                that.form.setState({ formData: metadata });
            };
        };

        file_input.click();
    }

    downloadMetadata() {
        saving = true;
        this.form.submitButton.click();
    }

    render() {
        return (
            <div>
                <YodaButtons uploadMetadata={this.uploadMetadata} downloadMetadata={this.downloadMetadata} />
                <YodaForm ref={(form) => {this.form=form;}}/>
                <YodaButtons uploadMetadata={this.uploadMetadata} downloadMetadata={this.downloadMetadata} />
            </div>
        );
    }
};

async function loadForm() {
    const [schemaResponse, uiSchemaResponse] = await Promise.all([
      fetch('https://raw.githubusercontent.com/UtrechtUniversity/yoda-ruleset/development/schemas/default-3/metadata.json'),
      fetch('https://raw.githubusercontent.com/UtrechtUniversity/yoda-ruleset/development/schemas/default-3/uischema.json')
    ]);
    schema = await schemaResponse.json();
    uiSchema = await uiSchemaResponse.json();

    // Select validator based on schema.
    if (schema.$schema == "http://json-schema.org/draft-07/schema") {
        validator = validatorAjvDraft7
    } else {
        validator = validatorAjv2019
    }

    render(<Container/>, document.getElementById('form'));
    updateCompleteness();
}

$(_ => loadForm());

async function submitData(data) {
    // Remove empty arrays and array items when saving.
    for (const property in data) {
        if (Array.isArray(data[property])) {
            var unfiltered = data[property];
            var filtered = unfiltered.filter(e => e);

            if (filtered.length === 0) {
                delete data[property];
            } else {
                data[property] = filtered;
            }
        }
    }

    data.links = [
        {
            "rel": "describedby",
            "href": schema.$id
        }
    ]

    const blob = new Blob([JSON.stringify(data, null, 4)], { type: "text/json" });
    const link = document.createElement("a");

    link.download = "yoda-metadata.json";
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove()
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
