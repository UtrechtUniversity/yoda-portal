import React, { Component } from "react";
import { render } from "react-dom";
import Select from 'react-select';
import axios from "axios";

class Vocabulary extends React.Component {
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

    render() {
        let title = this.props.schema.title || this.props.uiSchema["ui:title"];
        let help = this.props.uiSchema["ui:help"];

        return (
            <div>
                <label className="form-label">{title}</label>
                <Select
                    className={'select-box'}
                    options={this.state.options}
                    isDisabled={this.props.readonly}
                    placeholder={this.state.placeholder}
                    onChange={(event) => this.props.onChange(event.value)} />
                {help && (
                    <small className="text-muted form-text">
                        <p className="help-block">{help}</p>
                    </small>
                )}
            </div>
        );
    }
}

export default Vocabulary;
