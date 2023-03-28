import React, { Component } from 'react'
import { render } from 'react-dom'
import CreatableSelect from 'react-select/creatable'
import axios from 'axios'

class ROR extends React.Component {
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

    const title_aff_name = this.props.schema.properties.Affiliation_Name.title
    const title_aff_identifier = this.props.schema.properties.Affiliation_Identifier.title

    const title = this.props.schema.title || this.props.uiSchema['ui:title']
    let label = <label className='form-label'>{title_aff_name}</label>
    const help = this.props.uiSchema['ui:help']
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

    if ((this.props.rawErrors !== undefined && this.props.rawErrors.indexOf(error) >= 0) || (required && this.props.formData == null)) {
      label = <label className='text-danger form-label select-required'>{title}*</label>
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
      label = <label className='form-label select-required select-filled'>{title_aff_name}*</label>
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
          {help && (
            <small className='text-muted form-text'>
              <p className='help-block'>{help}</p>
            </small>
          )}
        </div>

        <div className='col compound-field'>
          <div className='mb-0 form-group'>
            <label className='form-label'>{title_aff_identifier}</label>
            <input type='text' className='form-control' name='blablaAffiliation_Identifier' onChange={this.handleChangeIdentifier} value={Affiliation_Identifier} />
          </div>

        </div>
      </div>
    )
  }
}

export default ROR
