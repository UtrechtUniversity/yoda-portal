import React, { Component } from 'react'
import { render } from 'react-dom'
import Select from 'react-select'
import { FieldProps } from '@rjsf/utils'
import InputMask from 'react-input-mask'

// The Person Identifier field will always be a combination of Name_Identifier_Scheme and Name_Identifier.
// This is a given and therefore these names can be directly used inside this code.
// Where it resides in, e.g. Creator or Contributor needs to be figured out here.
// As only on this level, it becomes clear whehter the combination field is actually required or not.
class PersonIdentifier extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      ...props.formData
    }

    const options = props.registry.rootSchema.definitions.optionsNameIdentifierScheme.enum
  }

  handleChange = (event) => {
    this.setFormData('Name_Identifier_Scheme', event.label)
  }

  handleIdentifierChange = (event) => {
    this.setFormData('Name_Identifier', event.target.value)
  }

  setFormData (fieldName, fieldValue) {
    this.setState({
      [fieldName]: fieldValue
    }, () => this.props.onChange(this.state))
  }

  render () {
    const { Name_Identifier_Scheme, Name_Identifier } = this.state

    const options = []
    this.props.registry.rootSchema.definitions.optionsNameIdentifierScheme.enum.forEach((option) => {
      options.push({ value: option, label: option })
    })

    const titleScheme = this.props.schema.properties.Name_Identifier_Scheme.title
    const titleIdentifier = this.props.schema.properties.Name_Identifier.title
    const helpScheme = this.props.uiSchema.Name_Identifier_Scheme['ui:help']

    // Dependant on selected name scheme the corresponding identifier field shows/does different things
    //  Selected scheme dependent help text handling
    // default value from schema (independent of name_scheme
    let helpIdentifier = this.props.uiSchema.Name_Identifier['ui:help']
    if (typeof this.props.uiSchema.Name_Identifier['ui:help-' + Name_Identifier_Scheme] !== 'undefined') {
      helpIdentifier = this.props.uiSchema.Name_Identifier['ui:help-' + Name_Identifier_Scheme]
    }

    // Selected scheme dependent MASK handling
    // default mask is to have no mask at all. I.e. ''. No need to have that declared in uischema.json
    let mask = ''
    if (typeof this.props.uiSchema.Name_Identifier['ui:field-mask-' + Name_Identifier_Scheme] !== 'undefined') {
      mask = this.props.uiSchema.Name_Identifier['ui:field-mask-' + Name_Identifier_Scheme]
    }

    // Define format characters.
    const formatChars = {
      9: '[0-9]',
      A: '[A-Z]',
      X: '[X]'
    }

    // Selected scheme dependent PLACEHOLDER handling
    let placeholder = ''
    if (typeof this.props.uiSchema.Name_Identifier['ui:field-placeholder-' + Name_Identifier_Scheme] !== 'undefined') {
      placeholder = this.props.uiSchema.Name_Identifier['ui:field-placeholder-' + Name_Identifier_Scheme]
    } else if (typeof this.props.uiSchema.Name_Identifier['ui:field-placeholder'] !== 'undefined') {
      placeholder = this.props.uiSchema.Name_Identifier['ui:field-placeholder']
    }

    const customStyles = {
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
    let parentContext = this.props.idSchema.$id
    parentContext = parentContext.replace(this.props.idPrefix + '_', '')
    parentContext = parentContext.replace('_' + this.props.name.replace('-', '_'), '')

    const parts = parentContext.split('_')
    parts.pop()
    parentContext = parts.join('_')

    // Check whether combination of 2 fields is a required 'field'
    let bothRequired = false
    // Make sure required is actually present.
    if (this.props.registry.rootSchema.properties[parentContext].items.required) {
      bothRequired = this.props.registry.rootSchema.properties[parentContext].items.required.includes('Person_Identifier')
    }

    // If either one holds a value, the other becomes a required element - hoe dit te testen!!
    let requiredScheme = ''
    if (bothRequired || ((typeof Name_Identifier !== 'undefined') && Name_Identifier.length > 0)) {
      requiredScheme = '*'
    }

    let requiredIdentifier = ''
    if (bothRequired || ((typeof Name_Identifier_Scheme !== 'undefined') && Name_Identifier_Scheme.length > 0)) {
      requiredIdentifier = '*'
    }

    // Validation of values and consequences for customstyles of each field
    // if scheme is required and holds no value => mark as erroneous/missing
    let customStylesScheme = customStyles
    if (requiredScheme === '*' && (typeof Name_Identifier_Scheme === 'undefined' || Name_Identifier_Scheme.length === 0)) {
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
    let classesIdentifierField = 'form-control'

    // Use pattern if exists for Identifier.
    if (this.props.schema.properties.Name_Identifier.pattern) {
      const regex = new RegExp(this.props.schema.properties.Name_Identifier.pattern)
      if (!(regex.test(Name_Identifier))) {
        classesIdentifierField += ' is-invalid'
      }
    } else if (requiredIdentifier === '*') {
      if (typeof Name_Identifier === 'undefined' || Name_Identifier.length === 0) {
        classesIdentifierField += ' is-invalid'
      }
    }

    // Add extra element so user can easily access corresponding search functionality.
    let searchLink
    let searchUrl = ''

    // Now find possible href/labels if Name_Identifier_Scheme is present.
    if (!this.props.readonly && (typeof Name_Identifier_Scheme !== 'undefined') && Name_Identifier_Scheme.length > 0) {
      if (Name_Identifier_Scheme === 'ORCID') {
        searchUrl = 'https://orcid.org/orcid-search/search?searchQuery='
      } else if (Name_Identifier_Scheme === 'Author identifier (Scopus)') {
        searchUrl = 'https://www.scopus.com/freelookup/form/author.uri?zone=TopNavBar&origin='
      }
    }

    // Only present link if there is a label/href combination for a non readonly field
    if (searchUrl.length) {
      searchLink = <a class='btn btn-sm btn-primary float-end' href={searchUrl} target='_blank' rel='noreferrer'><i class='fa-solid fa-magnifying-glass' aria-hidden='true' /> Lookup {Name_Identifier_Scheme}</a>
    }

    return (
      <div className='d-flex'>
        <div className='col compound-field'>
          <label className='form-label'>{titleScheme}{requiredScheme}</label>
          <Select
            className='select-box'
            options={options}
            isDisabled={this.props.readonly}
            placeholder={Name_Identifier_Scheme}
            onChange={this.handleChange}
            styles={customStylesScheme}
          />
          {helpScheme && (
            <small className='text-muted form-text'>
              <p className='help-block'>{helpScheme}</p>
            </small>
          )}
        </div>

        <div className='col compound-field'>
          <div className='mb-0 form-group'>
            <label className='form-label'>{titleIdentifier}{requiredIdentifier}</label>
            <InputMask
              className={classesIdentifierField}
              readOnly={this.props.readonly}
              isDisabled={this.props.readonly}
              value={Name_Identifier}
              placeholder={placeholder}
              onChange={this.handleIdentifierChange}
              mask={mask}
              formatChars={formatChars}
            />

            {searchLink}

            {helpIdentifier && (
              <small className='text-muted form-text'>
                <p className='help-block'>{helpIdentifier}</p>
              </small>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default PersonIdentifier
