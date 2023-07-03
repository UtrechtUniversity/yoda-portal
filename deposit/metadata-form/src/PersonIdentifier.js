import React, { Component } from 'react'
import { render } from 'react-dom'
// import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import axios from 'axios';
import { FieldProps } from "@rjsf/utils";
import InputMask from 'react-input-mask';


// The Person Identifier field will always be a combination of Name_Identifier_Scheme and Name_Identifier.
// This is a given and therefore these names can be directly used inside this code.
// Where it resides in, e.g. Creator or Contributor needs to be figured out here.
// As only on this level, it becomes clear whehter the combination field is actually required or not.
class PersonIdentifier extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.formData
        }

        const options = props.registry.rootSchema.definitions.optionsNameIdentifierScheme.enum;
    }

    handleChange = (event) => {
        // this.setState(this.state);

        this.setFormData('Name_Identifier_Scheme', event.label)
    }

    handleIdentifierChange = (event) => {

        this.setFormData('Name_Identifier', event.target.value)
        //this.setState({['Name_Identifier']: event.target.value});
    }

    setFormData (fieldName, fieldValue) {
        this.setState({
            [fieldName]: fieldValue
        }, () => this.props.onChange(this.state))
    }

    render () {
        const { Name_Identifier_Scheme, Name_Identifier } = this.state

        var options = [];
        this.props.registry.rootSchema.definitions.optionsNameIdentifierScheme.enum.forEach((option) => {
            options.push({'value': option,'label': option});
        });

        var title_scheme = this.props.schema.properties.Name_Identifier_Scheme.title
        var title_identifier = this.props.schema.properties.Name_Identifier.title
        var help_scheme= this.props.uiSchema['Name_Identifier_Scheme']['ui:help'];

        // Dependant on selected name scheme the corresponding identifier field shows/does different things
        //  Selected scheme dependent help text handling
        // default value from schema (independent of name_scheme
        var help_identifier = this.props.uiSchema['Name_Identifier']['ui:help'];
        if(typeof this.props.uiSchema['Name_Identifier']['ui:help-' + Name_Identifier_Scheme] !== "undefined") {
            help_identifier = this.props.uiSchema['Name_Identifier']['ui:help-' + Name_Identifier_Scheme];
        }

        // Selected scheme dependent MASK handling
        // default mask is to have no mask at all. I.e. ''. No need to have that declared in uischema.json
        var mask = '';
        if(typeof this.props.uiSchema['Name_Identifier']['ui:field-mask-' + Name_Identifier_Scheme] !== "undefined") {
            mask = this.props.uiSchema['Name_Identifier']['ui:field-mask-' + Name_Identifier_Scheme];
        }

        // Selected scheme dependent PLACEHOLDER handling
        var placeholder = '';
        if(typeof this.props.uiSchema['Name_Identifier']['ui:field-placeholder-' + Name_Identifier_Scheme] !== "undefined") {
            placeholder = this.props.uiSchema['Name_Identifier']['ui:field-placeholder-' + Name_Identifier_Scheme];
        }
        else if(typeof this.props.uiSchema['Name_Identifier']['ui:field-placeholder'] !== "undefined") {
            placeholder = this.props.uiSchema['Name_Identifier']['ui:field-placeholder'];
        }

        let customStyles = {
            control: styles => ({
                ...styles,
                border: '1px solid #ced4da',
                boxShadow: 'none',
                '&:hover': {
                    border: '1px solid #ced4da'
                }
            })
        }

        // total: yoda_Creator_0_Person_Identifier_1
        // postfix: Person_Identifier-1   !!!! let op hier staat -1 ipv _1
        // prefix: yoda
        // first strip pre- and postfix
        var parent_context = this.props.idSchema['$id'];
        parent_context = parent_context.replace(this.props.idPrefix + '_', '');
        parent_context = parent_context.replace('_' + this.props.name.replace('-','_'), '');

        var parts = parent_context.split('_');
        parts.pop();
        parent_context = parts.join('_');

        // Check whether combination of 2 fields is a required 'field'
        var both_required = false;
        // Make sure required is actually present.
        if (this.props.registry.rootSchema.properties[parent_context].items['required']) {
            both_required = this.props.registry.rootSchema.properties[parent_context].items.required.includes('Person_Identifier');
        }

        // If either one holds a value, the other becomes a required element - hoe dit te testen!!
        var required_scheme = ''
        if (both_required || (typeof Name_Identifier !== "undefined") && Name_Identifier.length > 0) {
            var required_scheme = '*';
        }

        var required_identifier = '';
        if (both_required || (typeof Name_Identifier_Scheme !== "undefined") && Name_Identifier_Scheme.length > 0) {
            var required_identifier = '*';
        }

        // DEZE ERROR handling moet nog worden toegevoegd op de een of andere manier?
        // const error = 'should be equal to one of the allowed values'
        // if (false) { // && (this.props.rawErrors !== undefined && this.props.rawErrors.indexOf(error) >= 0) || (required && this.props.formData.Name_Identifier_Scheme == null)) {


        // Validation of values and consequences for customstyles of each field
        // if scheme is required and holds no value => mark as erroneous/missing
        var customStylesScheme = customStyles;
        if (required_scheme == '*' && (typeof Name_Identifier_Scheme === "undefined" || Name_Identifier_Scheme.length == 0)) {
            customStylesScheme = {
                control: styles => ({
                    ...styles,
                    border: '1px solid #dc3545',
                    boxShadow: 'none',
                    '&:hover': {
                        border: '1px solid #dc3545'
                    }
                })
            }
        }

        // Validation of Identifier value
        var classes_identifier_field = 'form-control';
        // ORCID requires specific pattern test held in metadata schema
        // Should officially be taken from the metadata scheme (if then structure)
        if (Name_Identifier_Scheme == 'ORCID') {
            const regex = new RegExp(this.props.schema.properties.Name_Identifier.pattern);
            if (!(regex.test(Name_Identifier))) {
                classes_identifier_field += ' is-invalid';
            }
        }
        else if (required_identifier == '*') {
            if (typeof Name_Identifier === "undefined" || Name_Identifier.length == 0) {
                classes_identifier_field += ' is-invalid';
            }
        }

        // Add extra element so user can easily access corresponding search functionality
        let search_link;
        let search_href = ''
        let search_label = '';

        // Now find possible href/labels if Name_Identifier_Scheme is present.
        if (!this.props.readonly && (typeof Name_Identifier_Scheme !== "undefined") && Name_Identifier_Scheme.length > 0) {
            if (Name_Identifier_Scheme == 'ORCID') {
                search_href = 'https://orcid.org/orcid-search/search?searchQuery=';
                search_label = 'ORCID'
            } else if (Name_Identifier_Scheme == 'Author identifier (Scopus)') {
                search_href = 'https://www.scopus.com/freelookup/form/author.uri?zone=TopNavBar&origin=';
                search_label = 'Scopus Author Identifier'
            }
        }

        // Only present link if there is a label/href combination for a non readonly field
        if (search_href.length) {
            search_link = <a class="btn btn-sm btn-primary"  href={search_href} target="_blank"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Lookup {search_label}</a>
        }

        return (
            <div className='d-flex'>
                <div className='col compound-field'>
                    <label className='form-label'>{title_scheme}{required_scheme}</label>
                    <Select
                        className='select-box'
                        options={options}
                        isDisabled={this.props.readonly}
                        placeholder={Name_Identifier_Scheme}
                        onChange={this.handleChange}
                        styles={customStylesScheme}
                    />
                    {help_scheme && (
                        <small className='text-muted form-text'>
                            <p className='help-block'>{help_scheme}</p>
                        </small>
                    )}
                </div>

                <div className='col compound-field'>
                    <div className='mb-0 form-group'>
                        <label className='form-label'>{title_identifier}{required_identifier}</label>
                        <InputMask
                            className={classes_identifier_field}
                            readOnly={this.props.readonly}
                            isDisabled={this.props.readonly}
                            value={Name_Identifier}
                            placeholder={placeholder}
                            onChange={this.handleIdentifierChange}
                            mask={mask}
                        />

                        {search_link}

                        {help_identifier && (
                            <small className='text-muted form-text'>
                                <p className='help-block'>{help_identifier}</p>
                            </small>
                        )}
                    </div>
                </div>
            </div>
        )
    }
}

export default PersonIdentifier
