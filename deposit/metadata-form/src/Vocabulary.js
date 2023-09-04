import React, { Component } from 'react'
import { FieldProps } from '@rjsf/utils'
import { render } from 'react-dom'
import Select from 'react-select'
import axios from 'axios'

class Vocabulary extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      ...props.formData,
      options: '',
      placeholder: props.uiSchema['ui:default']
    }

    const url = props.uiSchema['ui:data']

    const loadData = async () => {
      const arr = []
      await axios.get(url).then((res) => {
        const result = res.data
        result.map((item) => {
          return arr.push({ value: item.value, label: item.label })
        })
        // Fill options data
        this.setState({ options: arr })

        // Find the label by the form data key
        const option = arr.find(o => o.value === this.props.formData)
        if (option !== undefined) {
          this.setState({ placeholder: option.label })
        }
      })
    }
    loadData()
  }

  render () {
    const title = this.props.schema.title || this.props.uiSchema['ui:title']
    let label = <label className='form-label'>{title}</label>
    const help = this.props.uiSchema['ui:help']
    let customStyles = {
        control: (styles) => ({
          ...styles,
          border: colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da',
          boxShadow: 'none',
          '&:hover': {
            border: colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da',
          }
        })
    }

    const darkThemeColors = {
        /* For theme color guidance: https://github.com/JedWatson/react-select/issues/3692#issuecomment-523425096 */
        /*
         * control/backgroundColor
         * menu/backgroundColor
         * option/color(selected)
         */
        neutral0: '#212529',

        /*
         * control/backgroundColor(disabled)
         */
        neutral5: '#212529',

        /*
         * control/borderColor(disabled)
         * multiValue/backgroundColor
         * indicators(separator)/backgroundColor(disabled)
         */
        neutral10: '#343a40',

        /*
         * control/borderColor
         * option/color(disabled)
         * indicators/color
         * indicators(separator)/backgroundColor
         * indicators(loading)/color
         */
        neutral20: '#343a40',

        /*
         * control/borderColor(focused)
         * control/borderColor:hover
         */
        neutral30: '#343a40',

        /*
         * input/color
         * multiValue(label)/color
         * singleValue/color
         * indicators/color(focused)
         * indicators/color:hover(focused)
         */
        neutral80: 'var(--neutral-10)',
        neutral90: 'var(--neutral-10)',

         /*
          * One of the few bootstrap variables we can use with themeing react-select!
          * control/boxShadow(focused)
          * control/borderColor(focused)
          * control/borderColor:hover(focused)
          * option/backgroundColor(selected)
          * option/backgroundColor:active(selected)
          */
        primary: 'var(--bs-primary)',

        /*
         * option/backgroundColor(focused)
         */
        primary25: '#2b3035',

        /*
         * option/backgroundColor:active
         */
        primary50: '#2b3035',
        primary75: '#2b3035',
    };

    // Check what theme is set
    const colorMode = document.documentElement.getAttribute('data-bs-theme');

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
      label = <label className='form-label select-required select-filled'>{title}*</label>
    }

    return (
      <div>
        {label}
        <Select
          className='select-box'
          options={this.state.options}
          required={required}
          isDisabled={this.props.readonly}
          placeholder={this.state.placeholder}
          onChange={(event) => this.props.onChange(event.value)}
          styles={customStyles}
          theme={(theme) => ({
              ...theme,
              colors: (colorMode === 'dark') ? {...theme.colors, ...darkThemeColors} : {...theme.colors},
          })}
        />
        {help && (
          <small className='text-muted form-text'>
            <p className='help-block'>{help}</p>
          </small>
        )}
      </div>
    )
  }
}

export default Vocabulary
