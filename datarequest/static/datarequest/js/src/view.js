import "core-js/stable";
import "regenerator-runtime/runtime";
import React, { Component } from "react";
import { render } from "react-dom";
import Form from "@rjsf/bootstrap-4";
import DataSelection, { DataSelectionCart } from "./DataSelection.js";

$(document).ajaxSend((e, request, settings) => {
    // Append a CSRF token to all AJAX POST requests.
    if (settings.type === 'POST' && settings.data.length) {
         settings.data
             += '&' + encodeURIComponent(Yoda.csrf.tokenName)
              + '=' + encodeURIComponent(Yoda.csrf.tokenValue);
    }
});

document.addEventListener("DOMContentLoaded", async () => {

    var datarequestSchema = {};
    var datarequestUiSchema = {};
    var datarequestFormData = {};
    var datarequestSchemaVersion = {};
    var datarequestStatus = {};
    var datarequestStatusInt = null;
    var datarequestType = "";

    // Get data request
    await Yoda.call('datarequest_get',
        {request_id: config.request_id},
        {errorPrefix: "Could not get datarequest"})
    .then(datarequest => {
        datarequestFormData      = JSON.parse(datarequest.requestJSON);
        datarequestSchemaVersion = datarequest.requestSchemaVersion;
        datarequestStatus        = datarequest.requestStatus;
        datarequestType          = datarequest.requestType;
    })
    // Set progress bar according to status of data request
    .then(() => {
        let datarequestRejected  = false;

        // Get progress
        if (datarequestType == "REGULAR") {
            switch(datarequestStatus) {
                case 'SUBMITTED':
                case 'PRELIMINARY_ACCEPT':
                case 'PRELIMINARY_REJECT':
                case 'PRELIMINARY_RESUBMIT':
                case 'DATAMANAGER_ACCEPT':
                case 'DATAMANAGER_REJECT':
                case 'DATAMANAGER_RESUBMIT':
                    datarequestStatusInt = 0;
                    break;
                case 'UNDER_REVIEW':
                case 'REJECTED_AFTER_DATAMANAGER_REVIEW':
                case 'RESUBMIT_AFTER_DATAMANAGER_REVIEW':
                    datarequestStatusInt = 1;
                    break;
                case 'REVIEWED':
                case 'REJECTED':
                case 'RESUBMIT':
                    datarequestStatusInt = 2;
                    break;
                case 'APPROVED':
                    datarequestStatusInt = 3;
                    break;
                case 'PREREGISTRATION_SUBMITTED':
                case 'PREREGISTRATION_CONFIRMED':
                    datarequestStatusInt = 4;
                    break;
                case 'DTA_READY':
                    datarequestStatusInt = 5;
                    break;
                case 'DTA_SIGNED':
                    datarequestStatusInt = 6;
                    break;
                case 'DATA_READY':
                    datarequestStatusInt = 7;
                    break;
            }
        } else if (datarequestType == "DAO") {
            switch(datarequestStatus) {
                case 'DAO_SUBMITTED':
                    datarequestStatusInt = 0;
                    break;
                case 'DAO_APPROVED':
                    datarequestStatusInt = 1;
                    break;
                case 'DTA_READY':
                    datarequestStatusInt = 2;
                    break;
                case 'DTA_SIGNED':
                    datarequestStatusInt = 3;
                    break;
                case 'DATA_READY':
                    datarequestStatusInt = 4;
                    break;
            }
        }

        // Get rejection status
        switch(datarequestStatus) {
            case 'PRELIMINARY_REJECT':
            case 'PRELIMINARY_RESUBMIT':
            case 'REJECTED_AFTER_DATAMANAGER_REVIEW':
            case 'RESUBMIT_AFTER_DATAMANAGER_REVIEW':
            case 'REJECTED':
            case 'RESUBMIT':
                datarequestRejected = true;
        }

        // Activate the appropriate steps
        for (const num of Array(datarequestStatusInt + 1).keys()) {
            let elem = document.getElementById("step-" + num);
            elem.classList.remove("disabled");
            elem.classList.add("complete");
            // Grey out the progress overview if proposal is rejected
            if (datarequestRejected) {
                elem.classList.add("rejected");
            }
        }
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
    if (config.available_documents.includes("assignment")) {
        var assignSchema   = {};
        var assignUiSchema = {};
        var assignFormData = {};

        // Get assignment schema and uischema
        Yoda.call("datarequest_schema_get",
                  {schema_name: "assignment"})
        .then(response => {
            assignSchema   = response.schema;
            assignUiSchema = response.uischema;
        })
        // Get assignment
        .then(async () => {
            await Yoda.call("datarequest_assignment_get",
                            {request_id: config.request_id},
                            {errorPrefix: "Could not get assignment"})
            .then(response => {
            assignFormData = JSON.parse(response);
            assignSchema.dependencies.decision.oneOf[0].properties.assign_to.items.enum = assignFormData.assign_to;
            assignSchema.dependencies.decision.oneOf[0].properties.assign_to.items.enumNames = assignFormData.assign_to;
            })
        })
        // Render assignment as disabled form
        .then(() => {
            render(<ContainerReadonly schema={assignSchema}
                                      uiSchema={assignUiSchema}
                                      formData={assignFormData} />,
                   document.getElementById("assign"));
        });
    }

    if (config.available_documents.includes("datamanager_review")) {
        var dmrSchema   = {};
        var dmrUiSchema = {};
        var dmrFormData = {};

        // Get data manager review
        Yoda.call("datarequest_datamanager_review_get",
                  {request_id: config.request_id},
                  {errorPrefix: "Could not get datamanager review"})
        .then(response => {
            dmrFormData = JSON.parse(response);
        })
        // Get data manager review schema and uischema
        .then(async () => {
            await Yoda.call("datarequest_schema_get", {schema_name: "datamanager_review"})
            .then(response => {
                dmrSchema   = response.schema;
                dmrUiSchema = response.uischema;
            })
        })
        // Render data manager review as disabled form
        .then(() => {
            render(<ContainerReadonly schema={dmrSchema}
                                      uiSchema={dmrUiSchema}
                                      formData={dmrFormData} />,
                   document.getElementById("datamanagerReview"));
        });
    }

    if (config.available_documents.includes("preliminary_review")) {
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
                   document.getElementById("preliminaryReview"));
        });
    }

    if (config.available_documents.includes("evaluation")) {
        var evalSchema   = {};
        var evalUiSchema = {};
        var evalFormData = {};

        // Get evaluation
        Yoda.call('datarequest_evaluation_get',
            {request_id: config.request_id},
            {errorPrefix: "Could not get evaluation"})
        .then(response => {
            evalFormData = JSON.parse(response);
        })
        // Get evaluation schema and uischema
        .then(async () => {
            await Yoda.call("datarequest_schema_get", {schema_name: "evaluation"})
            .then(response => {
                evalSchema   = response.schema;
                evalUiSchema = response.uischema;
            })
        })
        // Render evaluation as disabled form
        .then(() => {
            render(<ContainerReadonly schema={evalSchema}
                                      uiSchema={evalUiSchema}
                                      formData={evalFormData} />,
                   document.getElementById("evaluation"));
        });
    }

    if (config.available_documents.includes("review")) {
        var reviewSchema = {};
        var reviewUiSchema = {};
        var reviewFormData = {};

        // Get the reviews and render them in as disabled forms
        Yoda.call("datarequest_reviews_get",
                  {request_id: config.request_id},
                  {errorPrefix: "Could not get reviews"})
        .then(response => {
            reviewFormData = JSON.parse(response);
        })
        // Get review schema and uischema
        .then(async () => {
            await Yoda.call("datarequest_schema_get", {schema_name: "review"})
            .then(response => {
                reviewSchema   = response.schema;
                reviewUiSchema = response.uischema;
            })
        })
        .then(() => {
            var reviews = reviewFormData.map((line, i) => {
              let reviewDiv="review" + [i] + "Div";
              return(
                <div class="card mb-3">
                    <div class="card-header clearfix">
                        <div class="input-group-sm has-feedback float-start">
                            <a class="btn btn-secondary collapse-buttons" data-bs-toggle="collapse" href={"#" + reviewDiv} role="button" aria-expanded="false">
                                <span class="text-collapsed">Show</span>
                                <span class="text-expanded">Hide</span>
                            </a>
                        </div>
                        <h5 class="float-start">Review by {reviewFormData[i].username}</h5>
                    </div>
                    <div id={reviewDiv} class="card-body collapse">
                        <ContainerReadonly schema={reviewSchema}
                                           uiSchema={reviewUiSchema}
                                           formData={reviewFormData[i]} />
                    </div>
                </div>
              );
            });
            render(<div>{reviews}</div>, document.getElementById("reviews"));
        });
    }

    if (config.available_documents.includes("preregistration")) {
        var preregistrationSchema = {};
        var preregistrationUiSchema = {};
        var preregistrationFormData = {};

        // Get preregistration form 
        Yoda.call('datarequest_preregistration_get',
            {request_id: config.request_id},
            {errorPrefix: "Could not get preregistration"})
        .then(response => {
            preregistrationFormData = JSON.parse(response);
        })
        // Get preregistration schema and uischema
        .then(async () => {
            await Yoda.call("datarequest_schema_get", {schema_name: "preregistration"})
            .then(response => {
                preregistrationSchema   = response.schema;
                preregistrationUiSchema = response.uischema;
            })
        })
        // Render preregistration as disabled form
        .then(() => {
            render(<ContainerReadonly schema={preregistrationSchema}
                                      uiSchema={preregistrationUiSchema}
                                      formData={preregistrationFormData} />,
                   document.getElementById("preregistration")
            );
        });
    }

    // Render and show the modal for uploading a DTA
    $("body").on("click", "button.upload_dta", () => {
        $("#uploadDTA").modal("show");
    });

    $("body").on("click", "button.submit_dta", data => {
        // Prepare form data
        var fd = new FormData(document.getElementById('dta'));
        fd.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue);

        // Prepare XHR
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/datarequest/upload_dta/" + config.request_id);
        // Check if file has PDF mimetype. Reload page if upload has succeeded
        xhr.onload = function () {
            if (this.status == 400) {
                $("#dta-non-pdf-warning").removeClass("hidden");
            } else if (this.status == 200) {
                $("#uploadDTA").modal("hide");
                xhr.onload = location.reload();
            }
        }
        // Send DTA
        xhr.send(fd);
    });

    // Render and show the modal for uploading a signed DTA
    $("body").on("click", "button.upload_signed_dta", () => {
        $("#uploadSignedDTA").modal("show");
    });

    $("body").on("click", "button.submit_signed_dta", data => {
        // Prepare form data
        var fd = new FormData(document.getElementById('signed_dta'));
        fd.append(Yoda.csrf.tokenName, Yoda.csrf.tokenValue);

        // Prepare XHR
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/datarequest/upload_signed_dta/" + config.request_id);
        // Check if file has PDF mimetype. Reload page if upload has succeeded
        xhr.onload = function () {
            if (this.status == 400) {
                $("#signed-dta-non-pdf-warning").removeClass("hidden");
            } else if (this.status == 200) {
                $("#uploadSignedDTA").modal("hide");
                xhr.onload = location.reload();
            }
        }

        // Send signed DTA
        xhr.send(fd);
    });
});

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
