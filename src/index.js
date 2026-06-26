import React, { Component } from "react";
import { createRoot } from "react-dom/client";
import Form from '@rjsf/bootstrap-4';
import { customizeValidator } from '@rjsf/validator-ajv8';
import Ajv2019 from 'ajv/dist/2019';
import Select from 'react-select';

import AffiliationIdentifier from './AffiliationIdentifier'
import CustomArrayFieldTemplate from './CustomArrayFieldTemplate'
import CustomErrorListTemplate from './CustomErrorListTemplate'
import CustomFieldTemplate from './CustomFieldTemplate'
import CustomObjectFieldTemplate from './CustomObjectFieldTemplate'
import Geolocation from './Geolocation'
import TreeKeywordSelector from './TreeKeywordSelector'
import PersonIdentifier from './PersonIdentifier'
import Vocabulary from './Vocabulary'

import generalSchema from '../metadata/general-metadata.json';
import rightsSchema from '../metadata/rights-metadata.json';
import keywordsSchema from '../metadata/keywords-metadata.json';

// State variables
let schema = {};
let uiSchema = {};
let yodaFormData = {};
let validator;
let saving = false;

// Validators
const validatorAjv2019 = customizeValidator({ AjvClass: Ajv2019, ajvOptionsOverrides: {verbose: true, addUsedSchema: false } });

// Custom enum widget
const enumWidget = (props) => {
    let enumArray = props['schema']['enum'];
    let enumNames = props['schema']['enumNames'];

    if (enumNames == null)
        enumNames = enumArray;

    let i = enumArray.indexOf(props['value']);
    let placeholder = enumNames[i] == null ? ' ' : enumNames[i];

    const colorMode = document.documentElement.getAttribute('data-bs-theme');

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

    let required = props.required;
    let error = "should be equal to one of the allowed values";

    // Parse field hierarchy from id
    var list = props.id.replace('yoda_', '').split('_');
    var name_hierarchy = [], level_counter = 0, level_name = '', last_was_numeric = false;

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

    if (!last_was_numeric) {
        name_hierarchy[level_counter] = level_name;
    }

    if (name_hierarchy.length == 1) {
        required = schema.required.includes(name_hierarchy[0]);
    }

    let selectCompletenessClasses = '';

    if((props.rawErrors !== undefined && props.rawErrors.indexOf(error) >= 0) || (required && props.value == null)) {
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
        selectCompletenessClasses = 'select-required select-filled';
    }

    return (
        <div>
            <selectTotals className={selectCompletenessClasses}></selectTotals>
            <Select
                className="select-box"
                placeholder={placeholder}
                required={required}
                isDisabled={props.readonly}
                onChange={(event) => props.onChange(event.value)}
                options={props['options']['enumOptions']}
                styles={customStyles}
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

const templates = {
    ArrayFieldTemplate: CustomArrayFieldTemplate,
    ObjectFieldTemplate: CustomObjectFieldTemplate,
    ErrorListTemplate: CustomErrorListTemplate,
    FieldTemplate: CustomFieldTemplate
};

// Merge schemas utility
function mergeSchemas(schemas, requiredFields = [], schemaId = null) {
  const definitions = {};
  const properties = {};

  schemas.forEach(({ name, schema }) => {
    if (schema.definitions) {
      Object.entries(schema.definitions).forEach(([defName, defSchema]) => {
        definitions[`${name}_${defName}`] = defSchema;
      });
    }

    const schemaStr = JSON.stringify(schema);
    const updatedStr = schemaStr.replace(
      /#\/definitions\//g,
      `#/definitions/${name}_`
    );
    const updatedSchema = JSON.parse(updatedStr);

    const { definitions: _, ...schemaWithoutDefs } = updatedSchema;
    definitions[name] = schemaWithoutDefs;

    properties[name] = { title: `${name}`, $ref: `#/definitions/${name}` };
  });

  const mergedSchema = {
    $id: "unnamed-0",
    $schema: "https://json-schema.org/draft/2019-09/schema",
    definitions,
    type: "object",
    properties,
    required: requiredFields.length > 0 ? requiredFields : Object.keys(properties)
  };

  if (schemaId) {
    mergedSchema.$id = schemaId;
  }

  return mergedSchema;
}

// Components
class SchemaSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="form-group mb-3">
                <div className="row mb-3">
                    <div className="col-sm-12">
                        <label htmlFor="schemaId" className="form-label">Schema ID</label>
                        <input
                            type="text"
                            className="form-control"
                            id="schemaId"
                            placeholder="Enter schema identifier"
                            value={this.props.schemaId}
                            onChange={(e) => this.props.onSchemaIdChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-sm-12">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="schemaGeneral"
                                checked={true}
                                disabled={true}
                            />
                            <label className="form-check-label" htmlFor="schemaGeneral">
                                General
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="schemaRights"
                                checked={this.props.activeSchemas.includes("rights")}
                                onChange={() => this.props.toggleSchema("rights")}
                            />
                            <label className="form-check-label" htmlFor="schemaRights">
                                Rights
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="schemaKeywords"
                                checked={this.props.activeSchemas.includes("keywords")}
                                onChange={() => this.props.toggleSchema("keywords")}
                            />
                            <label className="form-check-label" htmlFor="schemaKeywords">
                                Keywords
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class YodaForm extends React.Component {
    constructor(props) {
        super(props);

        const formContext = {
            saving: false
        };

        const schemasToMerge = [];
        if (this.props.activeSchemas.includes("general")) {
            schemasToMerge.push({ name: "general", schema: generalSchema });
        }
        if (this.props.activeSchemas.includes("rights")) {
            schemasToMerge.push({ name: "rights", schema: rightsSchema });
        }
        if (this.props.activeSchemas.includes("keywords")) {
            schemasToMerge.push({ name: "keywords", schema: keywordsSchema });
        }

        schema = mergeSchemas(schemasToMerge, this.props.activeSchemas, this.props.schemaId);
        validator = validatorAjv2019;
        this.state = {
            formData: yodaFormData,
            formContext: formContext
        };
    }

    onError(form) {
        let formContext = {...this.state.formContext};
        formContext.saving = saving;
        this.setState({ formContext: formContext });
    }

    transformErrors(errors) {
        if (saving) {
            return errors.filter((e) => e.name !== 'required' && e.name !== 'dependencies' && e.name !== 'enum' && e.name !== 'type');
        }
        return errors;
    }

    render () {
        return (
            <Form className="metadata-form"
                  schema={schema}
                  idPrefix="yoda"
                  uiSchema={uiSchema}
                  fields={fields}
                  formData={this.state.formData}
                  formContext={this.state.formContext}
                  liveValidate={true}
                  noValidate={false}
                  noHtml5Validate={true}
                  showErrorList="top"
                  widgets={widgets}
                  templates={templates}
                  onChange={(e) => {
                      yodaFormData = e.formData;
                      this.setState({ formData: e.formData });
                      this.props.onFormDataChange(e.formData);
                  }}
                  onError={this.onError.bind(this)}
                  transformErrors={this.transformErrors}
                  validator={validator}>
                <button ref={(btn) => {this.submitButton=btn;}} className="hidden" />
            </Form>
        );
    }
}

class DebugDisplay extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <div className="row">
                    <div className="col-md-6">
                        <h5>Merged Schema</h5>
                        <pre style={{
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            maxHeight: '600px',
                            overflowY: 'auto',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                        }}>
                            {JSON.stringify(this.props.schema, null, 2)}
                        </pre>
                    </div>
                    <div className="col-md-6">
                        <h5>Form Data</h5>
                        <pre style={{
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            maxHeight: '600px',
                            overflowY: 'auto',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                        }}>
                            {JSON.stringify(this.props.formData, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        );
    }
}

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeSchemas: ["general"],
            schemaKey: 0,
            formData: {},
            schemaId: ""
        };
        this.toggleSchema = this.toggleSchema.bind(this);
        this.onFormDataChange = this.onFormDataChange.bind(this);
        this.onSchemaIdChange = this.onSchemaIdChange.bind(this);
    }

    toggleSchema(schemaName) {
        if (schemaName === "general") {
            return;
        }

        let newActiveSchemas = [...this.state.activeSchemas];

        if (newActiveSchemas.includes(schemaName)) {
            newActiveSchemas = newActiveSchemas.filter(s => s !== schemaName);
        } else {
            newActiveSchemas.push(schemaName);
        }

        this.setState({
            activeSchemas: newActiveSchemas,
            schemaKey: this.state.schemaKey + 1
        });
    }

    onFormDataChange(formData) {
        this.setState({ formData: formData });
    }

    onSchemaIdChange(schemaId) {
        this.setState({
            schemaId: schemaId,
            schemaKey: this.state.schemaKey + 1
        });
    }

    render() {
        return (
            <div className="row mb-3">
                <div className="col-md-12">
                    {/* Metadata Completion Card */}
                    <div className="card mb-3">
                        <div className="card-header">
                            <h5 className="card-title">Metadata schema composition</h5>
                        </div>
                        <div className="card-body">
                            <SchemaSelector
                                availableSchemas={["general", "rights", "keywords"]}
                                activeSchemas={this.state.activeSchemas}
                                toggleSchema={this.toggleSchema}
                                schemaId={this.state.schemaId}
                                onSchemaIdChange={this.onSchemaIdChange}
                            />
                        </div>
                    </div>

                    {/* Metadata Form Card */}
                    <div className="card mb-3">
                        <div className="card-header">
                            <h5 className="card-title">Metadata form</h5>
                        </div>
                        <div className="card-body">
                            <YodaForm
                                key={this.state.schemaKey}
                                activeSchemas={this.state.activeSchemas}
                                schemaId={this.state.schemaId}
                                ref={(form) => {this.form=form;}}
                                onFormDataChange={this.onFormDataChange}
                            />
                        </div>
                    </div>

                    {/* Debug Card */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title">Debug</h5>
                        </div>
                        <div className="card-body">
                            <DebugDisplay
                                schema={schema}
                                formData={this.state.formData}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

// Initialize React app
function loadForm() {
    const root = createRoot(document.getElementById('form'));
    root.render(<Container />);
}

// Load form when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadForm);
} else {
    loadForm();
}
