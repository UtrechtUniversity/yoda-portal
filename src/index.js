import React, { Component } from "react";
import { render } from "react-dom";
import Form from "@rjsf/bootstrap-4";
import Select from 'react-select';
import Geolocation from "./Geolocation";
import Vocabulary from "./Vocabulary";

const path = $('#form').attr('data-path');

let schema       = {};
let uiSchema     = {};
let yodaFormData = {};

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
        required = schema.required.includes(name_hierarchy[0]);
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
            {label}
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
    vocabulary: Vocabulary
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
        if (saving) {
            return errors.filter((e) => e.name !== 'required' && e.name !== 'dependencies' && e.name !== 'enum' && e.name !== 'type');
        }
        return errors;
    }

    ErrorListTemplate(props) {
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
                  ArrayFieldTemplate={ArrayFieldTemplate}
                  ObjectFieldTemplate={ObjectFieldTemplate}
                  FieldTemplate={CustomFieldTemplate}
                  liveValidate={true}
                  noValidate={false}
                  noHtml5Validate={true}
                  showErrorList={true}
                  ErrorList={this.ErrorListTemplate}
                  onSubmit={onSubmit}
                  widgets={widgets}
                  onChange={this.onChange.bind(this)}
                  onError={this.onError.bind(this)}
                  transformErrors={this.transformErrors}>
                <button ref={(btn) => {this.submitButton=btn;}} className="hidden" />
            </Form>
        );
    }
}

class YodaButtons extends React.Component {
    constructor(props) {
        super(props);
    }

    renderDownloadButton() {
        return (<button onClick={this.props.downloadMetadata} type="submit" className="btn btn-primary float-start">Download</button>);
    }

    renderFormCompleteness() {
        return (<div><span className="text-sm float-start text-muted text-center ms-3 mt-1">Required for the vault:</span><div className="form-completeness progress float-start ms-3 mt-2 w-25" data-bs-toggle="tooltip" title=""><div className="progress-bar bg-success"></div></div></div>);
    }

    renderButtons() {
        let buttons = [];

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
        this.downloadMetadata = this.downloadMetadata.bind(this);
    }

    downloadMetadata() {
        saving = true;
        this.form.submitButton.click();
    }

    render() {
        return (
            <div>
                <YodaButtons downloadMetadata={this.downloadMetadata} />
                <YodaForm ref={(form) => {this.form=form;}}/>
                <YodaButtons downloadMetadata={this.downloadMetadata} />
            </div>
        );
    }
};

async function loadForm() {
    const [schemaResponse, uiSchemaResponse] = await Promise.all([
      fetch('https://raw.githubusercontent.com/UtrechtUniversity/yoda-ruleset/development/schemas/default-2/metadata.json'),
      fetch('https://raw.githubusercontent.com/UtrechtUniversity/yoda-ruleset/development/schemas/default-2/uischema.json')
    ]);
    schema = await schemaResponse.json();
    uiSchema = await uiSchemaResponse.json();

    render(<Container/>, document.getElementById('form'));
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

function CustomFieldTemplate(props) {
    const {id, classNames, label, help, hidden, required, description, errors,
        rawErrors, children, displayLabel, formContext, readonly} = props;

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
}

function ObjectFieldTemplate(props) {
    const { TitleField, DescriptionField } = props;

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
            {(props.uiSchema["ui:title"] || props.title) && (
                <TitleField
                    id={`${props.idSchema.$id}__title`}
                    title={props.title || props.uiSchema["ui:title"]}
                    required={props.required}
                    formContext={props.formContext}
                />
            )}
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
}

function ArrayFieldTemplate(props) {
    const { DescriptionField, readonly, disabled } = props;

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
                                +
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
                                                &uarr;
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
                                                &darr;
                                            </button>
                                        </div>
                                    )}

                                    {el.hasRemove && (
                                        <div className="m-0 p-0">
                                            <button className="btn btn-light btn-sm" type="button" tabindex="-1"
                                                    onClick={el.onDropIndexClick(el.index)}>
                                                -
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
