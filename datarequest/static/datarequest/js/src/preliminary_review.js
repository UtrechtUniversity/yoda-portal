import "core-js/stable";
import "regenerator-runtime/runtime";
import React, { Component } from "react";
import { render } from "react-dom";
import Form from "@rjsf/bootstrap-4";
import DataSelection, { DataSelectionCart } from "./DataSelection.js";

document.addEventListener("DOMContentLoaded", async () => {

    // Get the schema of the data request preliminary review form
    Yoda.call("datarequest_schema_get", {schema_name: "preliminary_review"})
    .then(response => {
        let preliminaryReviewSchema = response.schema;
        let preliminaryReviewUiSchema = response.uischema;

        render(<Container schema={preliminaryReviewSchema}
                          uiSchema={preliminaryReviewUiSchema}
                          validate={validate} />,
               document.getElementById("preliminaryReview"));
    });

    var datarequestSchema = {};
    var datarequestUiSchema = {};
    var datarequestFormData = {};
    var datarequestSchemaVersion = {};

    // Get data request
    Yoda.call('datarequest_get',
        {request_id: config.request_id},
        {errorPrefix: "Could not get datarequest"})
    .then(datarequest => {
        datarequestFormData = JSON.parse(datarequest.requestJSON);
        datarequestSchemaVersion = datarequest.requestSchemaVersion;
    })
    // Get data request schema and uischema
    .then(async () => {
        await Yoda.call("datarequest_schema_get", {schema_name: "datarequest", version: datarequestSchemaVersion})
        .then(response => {
            datarequestSchema   = response.schema;
            datarequestUiSchema = response.uischema;
        })
    })
    // Render data request as disabled form
    .then(() => {
        render(<ContainerReadonly schema={datarequestSchema}
                                  uiSchema={datarequestUiSchema}
                                  formData={datarequestFormData} />,
               document.getElementById("datarequest")
        );
    });
});

class Container extends React.Component {
    constructor(props) {
        super(props);
        this.submitForm = this.submitForm.bind(this);
    }

    submitForm() {
        this.form.submitButton.click();
    }

    render() {
        return (
        <div>
          <YodaForm schema={this.props.schema}
                    uiSchema={this.props.uiSchema}
                    validate={validate}
                    ref={(form) => {this.form=form;}} />
          <YodaButtons submitButton={this.submitForm} />
        </div>
        );
    }
}

class ContainerReadonly extends React.Component {
    render() {
        return (
        <div>
          <YodaFormReadonly schema={this.props.schema}
                            uiSchema={this.props.uiSchema}
                            formData={this.props.formData} />
        </div>
      );
    }
}

class YodaForm extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Form className="form"
                  schema={this.props.schema}
                  uiSchema={this.props.uiSchema}
                  validate={validate}
                  idPrefix={"yoda"}
                  onSubmit={onSubmit}
                  showErrorList={false}
                  noHtml5Validate>
                  <button ref={(btn) => {this.submitButton=btn;}}
                          className="hidden" />
            </Form>
        );
    }
};

class YodaFormReadonly extends React.Component {
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
                  fields={fields}
                  disabled>
                  <button className="hidden" />
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
                        <button onClick={this.props.submitButton}
                                type="submit"
                                className="btn btn-primary">Submit</button>
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
  DataSelection: DataSelectionCart
};

function validate(formData, errors) {
    // The data request cannot be accepted if the conditions specified by the checkboxes haven't
    // been met. In the code below, an error is added to the checkboxes if the data request is
    // set to be accepted and the checkboxes are not checked.
    if (formData.preliminary_review == "Accepted for data manager review") {
        if (!formData.framework_and_ic_fit) {
            errors.framework_and_ic_fit.addError("If the data request is to be accepted, this checkbox must be checked.");
        }
        if (!formData.requestee_credentials) {
            errors.requestee_credentials.addError("If the data request is to be accepted, this checkbox must be checked.");
        }
    }

    return errors;
}

function submitData(data)
{
    // Disable submit button
    $("button:submit").text("Submitting...")
    $("button:submit").attr("disabled", "disabled");

    // Submit form and redirect to view/
    Yoda.call("datarequest_preliminary_review_submit",
        {data: data, request_id: config.request_id},
        {errorPrefix: "Could not submit data"})
    .then(() => {
        window.location.href = "/datarequest/view/" + config.request_id;
    })
    .catch(error => {
        // Re-enable submit button if submission failed
        $("button:submit").attr("disabled", false);
    });
}
