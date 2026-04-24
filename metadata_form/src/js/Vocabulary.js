import React from 'react'
import CreatableSelect from 'react-select/creatable'
import axios from 'axios'

class Vocabulary extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      ...props.formData,
      options: [],
      placeholder: props.uiSchema['ui:default'],
      isLoading: true,
      error: null
    }

    this.loadData()
  }

  loadData = async () => {
    try {
      const url = this.props.uiSchema['ui:data']
      const res = await axios.get(url)

      const arr = res.data.map((item) => ({
        value: item.value,
        label: item.label
      }))

      this.setState({ options: arr, isLoading: false })

      const option = arr.find(o => o.value === this.props.formData)
      if (option) {
        this.setState({ placeholder: option.label })
      }
    } catch (error) {
      console.error('Failed to load options:', error)
      this.setState({ error: error.message, isLoading: false })
    }
  }

  hasError = () => {
    const error = 'should be equal to one of the allowed values'
    return (this.props.rawErrors !== undefined &&
            this.props.rawErrors.indexOf(error) >= 0) ||
           (this.props.required && this.props.formData == null)
  }

  getCustomStyles = () => {
    const colorMode = this.props.formContext.colorMode
    const isError = this.hasError()

    return {
      control: (styles) => ({
        ...styles,
        border: isError
          ? '1px solid #dc3545'
          : colorMode === 'dark'
            ? '1px solid #495057'
            : '1px solid #ced4da',
        boxShadow: 'none',
        '&:hover': {
          border: isError
            ? '1px solid #dc3545'
            : colorMode === 'dark'
              ? '1px solid #495057'
              : '1px solid #ced4da'
        }
      })
    }
  }

  getTheme = () => {
    const colorMode = this.props.formContext.colorMode
    return (theme) => ({
      ...theme,
      colors: (colorMode === 'dark')
        ? { ...theme.colors, ...this.props.formContext.darkThemeColors }
        : { ...theme.colors }
    })
  }

  getLabel = () => {
    const title = this.props.schema.title || this.props.uiSchema['ui:title']
    const isError = this.hasError()
    const required = this.props.required

    if (isError) {
      return <label className='text-danger form-label select-required'>{title}*</label>
    } else if (required) {
      return <label className='form-label select-required select-filled'>{title}*</label>
    }

    return <label className='form-label'>{title}</label>
  }

  handleChange = (event) => {
    this.props.onChange(event?.value || '')
  }

  render () {
    const help = this.props.uiSchema['ui:help']
    const required = this.props.required

    return (
      <div>
        {this.getLabel()}
        <CreatableSelect
          className='select-box'
          options={this.state.options}
          required={required}
          isDisabled={this.props.readonly || this.state.isLoading}
          isLoading={this.state.isLoading}
          placeholder={this.state.placeholder}
          onChange={this.handleChange}
          styles={this.getCustomStyles()}
          theme={this.getTheme()}
        />
        {this.state.error && (
          <small className='text-danger form-text'>
            <p className='help-block'>Error loading options: {this.state.error}</p>
          </small>
        )}
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
