import "core-js/stable";
import "regenerator-runtime/runtime";
import React, { Component } from "react";
import { render } from "react-dom";
import Form from "@rjsf/bootstrap-4";
import DataSelection, { DataSelectionCart } from "./DataSelection.js";

document.addEventListener("DOMContentLoaded", async () => {

    // Get the schema of the data request review form for the data manager
    Yoda.call("datarequest_schema_get", {schema_name: "datamanager_review"})
    .then(response => {
        let datamanagerReviewSchema = response.schema;
        let datamanagerReviewUiSchema = response.uischema;

        render(<Container schema={datamanagerReviewSchema}
                          uiSchema={datamanagerReviewUiSchema} />,
               document.getElementById("datamanagerReview")
        );
    });

    var prSchema   = {};
    var prUiSchema = {};
    var prFormData = {};

    // Get preliminary review
    Yoda.call('datarequest_preliminary_review_get',
        {request_id: config.request_id},
        {errorPrefix: "Could not get preliminary review"})
    .then(response => {
        prFormData = JSON.parse(response);
    })
    // Get preliminary review schema and uischema
    .then(async () => {
        await Yoda.call("datarequest_schema_get", {schema_name: "preliminary_review"})
        .then(response => {
            prSchema   = response.schema;
            prUiSchema = response.uischema;
        })
    })
    // Render preliminary review as disabled form
    .then(() => {
        render(<ContainerReadonly schema={prSchema}
                                  uiSchema={prUiSchema}
                                  formData={prFormData} />,
               document.getElementById("preliminaryReview")
        );
    });

    var datarequestSchema   = {};
    var datarequestUiSchema = {};
    var datarequestFormData = {};

    // Get data request
    Yoda.call('datarequest_get',
        {request_id: config.request_id},
        {errorPrefix: "Could not get datarequest"})
    .then(datarequest => {
        datarequestFormData = JSON.parse(datarequest.requestJSON);
    })
    // Get data request schema and uischema
    .then(async () => {
        await Yoda.call("datarequest_schema_get", {schema_name: "datarequest"})
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

function submitData(data) {

    // Disable submit button
    $("button:submit").text("Submitting...")
    $("button:submit").attr("disabled", "disabled");

    // Submit form and redirect to view/
    Yoda.call("datarequest_datamanager_review_submit",
        {data: data, request_id: config.request_id},
        {errorPrefix: "Could not submit datamanager review"})
    .then(() => {
        window.location.href = "/datarequest/view/" + config.request_id;
    })
    .catch(error => {
        // Re-enable submit button if submission failed
        $("button:submit").attr("disabled", false);
    });
}
