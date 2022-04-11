import "core-js/stable";
import "regenerator-runtime/runtime";
import React, { Component } from "react";
import { render } from "react-dom";
import Form from "@rjsf/bootstrap-4"; 
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { numberFilter, textFilter, selectFilter, multiSelectFilter, Comparator } from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import DataSelection, { DataSelectionTable } from "./DataSelection.js";

let save = false;

document.addEventListener("DOMContentLoaded", async () => {

    // Get data request schema and uiSchema
    Yoda.call("datarequest_schema_get", {schema_name: "datarequest"})
    .then(response => {
        let datarequestSchema = response.schema;
        let datarequestUiSchema = response.uischema;

        // Determine if form should be prefilled...
        if (config.draft_request_id !== '' || config.previous_request_id !== '') {
            let datarequestFormData = {};

            // Determine with which data to prefill the form
            let requestId = config.draft_request_id !== '' ? config.draft_request_id : config.previous_request_id;

            // Get that data and render the prefilled form
            Yoda.call('datarequest_get',
                {request_id: requestId},
                {errorPrefix: "Could not get datarequest"})
            .then(data => {
                datarequestFormData = JSON.parse(data.requestJSON);

                // Add previous request ID to form data if applicable
                if (config.previous_request_id !== '') {
                    datarequestFormData['previous_request_id'] = config.previous_request_id;
                }

                render(<Container schema={datarequestSchema}
                                  uiSchema={datarequestUiSchema}
                                  formData={datarequestFormData}
                                  validate={validate} />,
                       document.getElementById("form"));
            });
        // ...if not, render blank form
        } else {
            render(<Container schema={datarequestSchema}
                              uiSchema={datarequestUiSchema}
                              validate={validate} />,
                   document.getElementById("form"));
        }
    });
});

// Some validations that cannot be done in the schema itself
function validate(formData, errors) {

    // Validate whether CC email addresses are valid
    //
    // First check whether any CC email addresses have been entered
    let cc_email_addresses = getNested(formData, 'contact', 'cc_email_addresses');
    if (typeof(cc_email_addresses) !== 'undefined') {
        // Then remove all spaces
        cc_email_addresses = cc_email_addresses.replace(/\s+/g, '');
        // Then check if they look like valid email addresses
        let cc_split = cc_email_addresses.split(",");
        for (const address of cc_split) {
            if (!isEmailAddress(address)) {
                errors.contact.cc_email_addresses.addError(
                    "One or more of the entered email addresses is invalid.");
                break;
            }
        };
    }

    return errors;
}

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.submitForm = this.submitForm.bind(this);
        this.saveForm = this.saveForm.bind(this);
    }

    submitForm() {
        save = false;
        this.form.submitButton.click();
    }

    saveForm() {
        save = true;
        this.form.submitButton.click();
    }

    render() {
        return (
        <div>
          <YodaForm schema={this.props.schema}
                    uiSchema={this.props.uiSchema}
                    formData={this.props.formData}
                    validate={this.props.validate}
                    ref={(form) => {this.form=form;}} />
          <YodaButtons submitButton={this.submitForm} saveButton={this.saveForm} />
        </div>
      );
    }
};

class YodaForm extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Form className="form"
                  schema={this.props.schema}
                  idPrefix={"yoda"}
                  uiSchema={this.props.uiSchema}
                  formData={this.props.formData}
                  validate={this.props.validate}
                  fields={fields}
                  onSubmit={onSubmit}
                  showErrorList={false}
                  noHtml5Validate
                  transformErrors={transformErrors}>
                  <button ref={(btn) => {this.submitButton=btn;}}
                          className="hidden" />
            </Form>
        );
    }
};

class YodaButtons extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="form-group">
                <div className="row yodaButtons">
                    <div className="col-sm-12">
                        <button id="saveButton" onClick={this.props.saveButton} type="submit" className="btn btn-secondary me-1">Save as draft</button>
                        <button id="submitButton" onClick={this.props.submitButton} type="submit" className="btn btn-primary">Submit</button>
                    </div>
                </div>
            </div>
        );
    }
}

const onSubmit = ({formData}) => submitData(formData);

const CustomDescriptionField = ({id, description}) => {
  return <div id={id} dangerouslySetInnerHTML={{ __html: description }}></div>;
};

const CustomTitleField = ({id, title}) => {
  title = "<h5>" + title + "</h5><hr class='border-0 bg-secondary' style='height: 1px;'>";
  return <div id={id} dangerouslySetInnerHTML={{ __html: title}}></div>;
};

const fields = {
  DescriptionField: CustomDescriptionField,
  TitleField: CustomTitleField,
  DataSelection: DataSelectionTable
};

function transformErrors(errors) {
    // Don't report any errors when saving as draft
    if (save) {
        return [];
    }

    // Filter out incorrect errors. These are erroneously added because of edge cases to do with
    // nesting, conditionals and the use of oneOf.
    var filtered_errors = [];
    errors.map(error => {
        if (!["should match exactly one schema in oneOf",
              "should be equal to one of the allowed values"].includes(error.message)) {
            filtered_errors.push(error)
        }
    });
    errors = filtered_errors;

    // Scroll to first error (ugly but works). A proper solution isn't available yet, see:
    // https://github.com/rjsf-team/react-jsonschema-form/issues/1791
    if (errors.length !== 0) {
        let first_error_property = errors[0].property;
        let elem_id = "yoda" + first_error_property.replace(/\./g, '_').replace(/\[/, '_').replace(/\]/, '').replace(/_array$/, '_array__title');
        let elem = document.getElementById(elem_id) !== null ? document.getElementById(elem_id) : document.getElementsByName(elem_id)[0].parentElement.parentElement;
        elem.parentElement.scrollIntoView();
    }

    return errors;
}

function submitData(data)
{
    // Disable button
    //
    // When saving a draft
    if (save) {
        $("#saveButton").text("Saving...");
        $("#saveButton").attr("disabled", "disabled");
        $("#submitButton").attr("disabled", "disabled");
    // When submitting the data request
    } else {
        $("#submitButton").text("Submitting...");
        $("#saveButton").attr("disabled", "disabled");
        $("#submitButton").attr("disabled", "disabled");
    }

    // If no data has been selected, set selectedRows to an empty array
    if (data['datarequest']['data']['selectedRows'] == undefined) {
        data['datarequest']['data']['selectedRows'] = [];
    }

    // Submit form
    Yoda.call("datarequest_submit",
        {data: data,
         draft: save,
         draft_request_id: typeof(config.draft_request_id) !== 'undefined' ? config.draft_request_id : null},
        {errorPrefix: "Could not submit data"})
    // Redirect if applicable
    .then(response => {
        if (save) {
            // If this is the first time the draft is saved, redirect to
            // add_from_draft/{draft_request_id}
            //
            // We know this is the case when the call returns a requestId, i.e. the requestId of the
            // newly created draft data request
            if (response !== null && response.hasOwnProperty('requestId')) {
                window.location.href = "/datarequest/add_from_draft/" + response.requestId;
            // If no draft requestId is returned, we are already working on a draft proposal and can
            // therefore stay on the same page (i.e. add_from_draft/{draft_request_id})
            } else {
                $("#saveButton").text("Save as draft");
                $('#saveButton').attr("disabled", false);
                $("#submitButton").attr("disabled", false);
            }
        // If attachments should be added, redirect to attachment upload page
        } else if  (response !== null && response.hasOwnProperty('pendingAttachments')) {
            window.location.href = "/datarequest/add_attachments/" + response.requestId;
        // If we are submitting the data request instead of saving it as a draft, redirect to index
        } else {
            window.location.href = "/datarequest/";
        }
    })
    .catch(error => {
        // Re-enable submit button if submission failed
        $("#submitButton").text("Submit");
        $("#saveButton").text("Save as draft");
        $('button:submit').attr("disabled", false);
    });
}

// https://stackoverflow.com/a/2631198
function getNested(obj, ...args) {
  return args.reduce((obj, level) => obj && obj[level], obj)
}

// https://stackoverflow.com/a/9204568
function isEmailAddress(address) {
    return address.match(/^[^\s@]+@[^\s@]+$/) !== null
}
