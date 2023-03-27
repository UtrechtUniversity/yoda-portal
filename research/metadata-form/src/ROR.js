import React, { Component } from "react";
import { render } from "react-dom";
import Select from 'react-select';
// import Creatable, { useCreatable } from 'react-select/creatable';
import CreatableSelect from 'react-select/creatable';
import axios from "axios";

class ROR extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.formData
            // hier mag niks staan want daarop valideert react en kan form niet worden bewaard
            // en de validatie moet een nivea dieper plaatsvinden.
        };

        // placeholder for the vocabulary options to be collected externally
        this.options = [];

        const url = props.uiSchema['ui:data'];

        const loadData = async () => {
            const arr = [];
            await axios.get(url).then((res) => {
                let result = res.data;
                result.map((item) => {
                    return arr.push({value: item.value, label: item.label});
                });
                // Fill options data
                // this.setState({ options: arr });
                //
                this.options = arr;

                console.log(this.options);

                // Find the label by the form data key
                let option = arr.find(o => o.value === this.props.formData);
                if (option !== undefined) {
                    // this.setState({ placeholder: option.label });
                }
            });
        };
        loadData();
    }

    handleChange = (event) => {
      console.log(event);
      this.setFormData("Affiliation_Name", event.label);
      // this.setFormData("Affiliation_Identifier", event.value);  // "fr - French");
      if (event.__isNew__ == undefined || event.__isNew__ == false) {
          this.setFormData("Affiliation_Identifier", event.value);
      }
    };

    handleChangeIdentifier = (event) => {
      this.setFormData("Affiliation_Identifier", event.target.value)
    };

    setFormData(fieldName, fieldValue) {
        this.setState({
            [fieldName]: fieldValue
        }, () => this.props.onChange(this.state));
    }

    render() {
        const {Affiliation_Name, Affiliation_Identifier} = this.state;


        console.log(this.props.schema);
        let title_aff_name = this.props.schema.properties.Affiliation_Name.title;
        let title_aff_identifier = this.props.schema.properties.Affiliation_Identifier.title;

        let title = this.props.schema.title || this.props.uiSchema["ui:title"];
        let label = <label className="form-label">{title_aff_name}</label>
        let help = this.props.uiSchema["ui:help"];
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
        let required = this.props.required
        let error = "should be equal to one of the allowed values";

        if((this.props.rawErrors !== undefined && this.props.rawErrors.indexOf(error) >= 0) || (required && this.props.formData == null)) {
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
            label = <label className="form-label select-required select-filled">{title_aff_name}*</label>
        }

        // When using this array definition here, the ROR-field works as it should. 
        this.options = [{value: 'en - English', label: 'English uni'}, {value: 'fr - French', label: 'French uni'}, {value: 'de - German uni', label: 'German'}, {value: 'https://ror.org/04pp8hn57', label: 'Utrecht University'}];

        return (
          <div className="d-flex">
            <div className="col compound-field">
                {label}
                <CreatableSelect
                    className={'select-box'}
                    options={this.options}
                    required={required}
                    isDisabled={this.props.readonly}
                    placeholder={Affiliation_Name}
                    onChange={this.handleChange}
                    styles={customStyles} />
                {help && (
                    <small className="text-muted form-text">
                        <p className="help-block">{help}</p>
                    </small>
                )}
            </div>

            <div className="col compound-field">
               <div className="mb-0 form-group">
                 <label className="form-label">{title_aff_identifier}</label>
                <input type='text' className='form-control' name="blablaAffiliation_Identifier" onChange={this.handleChangeIdentifier} value={Affiliation_Identifier}></input>
               </div>

            </div>
          </div>
        );
    }
}

export default ROR;
