import React, { Component } from 'react'
import { render } from 'react-dom'
import CreatableSelect from 'react-select/creatable'
import axios from 'axios'
import { FieldProps } from '@rjsf/utils'

class AffiliationIdentifier extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      ...props.formData
    }

    // Placeholder for the vocabulary options to be collected externally
    this.options = [{ value: 'https://ror.org/04pp8hn57', label: 'Utrecht University' }]

    const url = props.uiSchema['ui:data']

    const loadData = async () => {
      const arr = []
      await axios.get(url).then((res) => {
        const result = res.data
        result.map((item) => {
          return arr.push({ value: item.value, label: item.label })
        })
        // Fill options data
        this.options = arr

        // Trigger render.
        this.setState(this.state)
      })
    }
    loadData()
  }

  handleChange = (event) => {
    this.setFormData('Affiliation_Name', event.label)
    if (event.__isNew__ === undefined || event.__isNew__ === false) {
      this.setFormData('Affiliation_Identifier', event.value)
    }
  }

  handleChangeIdentifier = (event) => {
    this.setFormData('Affiliation_Identifier', event.target.value)
  }

  setFormData (fieldName, fieldValue) {
    this.setState({
      [fieldName]: fieldValue
    }, () => this.props.onChange(this.state))
  }

  render () {
    const { Affiliation_Name, Affiliation_Identifier } = this.state

    const titleAffiliationName = this.props.schema.properties.Affiliation_Name.title
    const titleAffiliationIdentifier = this.props.schema.properties.Affiliation_Identifier.title

    let label = <label className='form-label'>{titleAffiliationName}</label>

    const helpAffiliationName = this.props.uiSchema.Affiliation_Name['ui:help']
    const helpAffiliationIdentifier = this.props.uiSchema.Affiliation_Identifier['ui:help']

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
    const required = this.props.required
    const error = 'should be equal to one of the allowed values'
    if ((this.props.rawErrors !== undefined && this.props.rawErrors.indexOf(error) >= 0) || (required && this.props.formData.Affiliation_Name == null)) {
      label = <label className='text-danger form-label select-required'>{titleAffiliationName}*</label>
      customStyles = {
        control: styles => ({
          ...styles,
          border: '1px solid #dc3545',
          boxShadow: 'none',
          '&:hover': {
            border: '1px solid #dc3545'
          }
        })
      }
    } else if (required) {
      label = <label className='form-label select-required select-filled'>{titleAffiliationName}*</label>
    } else {
      label = <label className='form-label select-required select-filled'>{titleAffiliationName}</label>
    }

    return (
      <div className='d-flex'>
        <div className='col compound-field'>
          {label}
          <CreatableSelect
            className='select-box'
            options={this.options}
            required={required}
            isDisabled={this.props.readonly}
            placeholder={Affiliation_Name}
            onChange={this.handleChange}
            styles={customStyles}
          />
          {helpAffiliationName && (
            <small className='text-muted form-text'>
              <p className='help-block'>{helpAffiliationName}</p>
            </small>
          )}
        </div>

        <div className='col compound-field'>
          <div className='mb-0 form-group'>
            <label className='form-label'>{titleAffiliationIdentifier}</label>
            <input type='text' className='form-control' readOnly={this.props.readonly} onChange={this.handleChangeIdentifier} value={Affiliation_Identifier} />
            {helpAffiliationIdentifier && (
              <small className='text-muted form-text'>
                <p className='help-block'>{helpAffiliationIdentifier}</p>
              </small>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default AffiliationIdentifier
