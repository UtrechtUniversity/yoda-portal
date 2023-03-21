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
            ...props.formData,
            options: "",
            placeholder: props.uiSchema['ui:default']
        };

        const url = props.uiSchema['ui:data'];

        const loadData = async () => {
            const arr = [];
            await axios.get(url).then((res) => {
                let result = res.data;
                result.map((item) => {
                    return arr.push({value: item.value, label: item.label});
                });
                // Fill options data
                this.setState({ options: arr });

                // Find the label by the form data key
                let option = arr.find(o => o.value === this.props.formData);
                if (option !== undefined) {
                    this.setState({ placeholder: option.label });
                }
            });
        };
        loadData();
    }

    handleChange = (event) => {
      console.log('handleChange');
      console.log(event.label);
      console.log(event.value);
      $('#yoda_Creator_0_Affiliation_0_Affiliation_Identifier').attr('value', event.value);
      $('#yoda_Creator_0_Affiliation_0_Affiliation_Identifier').attr('placeholder', event.value);
    };

    render() {
        let title = this.props.schema.title || this.props.uiSchema["ui:title"];
        console.log(title);
        let label = <label className="form-label">{title}</label>
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
            label = <label className="form-label select-required select-filled">{title}*</label>
        }

        return (
            <div>
                {label}
                <CreatableSelect
                    className={'select-box'}
                    options={this.state.options}
                    required={required}
                    isDisabled={this.props.readonly}
                    placeholder={this.state.placeholder}

                    onChange={this.handleChange}


                    styles={customStyles} />
                {help && (
                    <small className="text-muted form-text">
                        <p className="help-block">{help}</p>
                    </small>
                )}
            </div>
        );
    }
}

export default ROR;
