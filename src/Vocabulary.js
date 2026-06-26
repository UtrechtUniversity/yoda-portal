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
      error: null,
      dataMap: {}
    }

    this.loadData()
  }

  /**
   * Normalize the data format, supports these formats:
   * 1. { value: str, label: str }
   * 2. { identifier: str, name: str, affiliation_name: str, affiliation_ror: str }
   */
  normalizeData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return { options: [], dataMap: {} }
    }

    const firstItem = data[0]
    const dataMap = {}
    let options = []

    // 1. { value: str, label: str }
    if ('value' in firstItem && 'label' in firstItem) {
      options = data.map((item) => ({
        value: item.value,
        label: item.label
      }))

      data.forEach((item) => {
        dataMap[item.value] = {
          value: item.value,
          label: item.label
        }
      })
    // 2. { identifier: str, name: str, affiliation_name: str, affiliation_ror: str }
    } else if ('identifier' in firstItem && 'name' in firstItem) {
      options = data.map((item) => ({
        value: item.identifier,
        label: item.name
      }))

      data.forEach((item) => {
        dataMap[item.identifier] = {
          identifier: item.identifier,
          name: item.name,
          affiliation_name: item.affiliation_name || null,
          affiliation_ror: item.affiliation_ror || null
        }
      })
    // Format not supported, log a warning and return empty.
    } else {
      console.warn('Unknown data format')
      return { options: [], dataMap: {} }
    }

    // Sort options alphabetically by label.
    options.sort((a, b) => a.label.localeCompare(b.label))

    return { options, dataMap }
  }

  loadData = async () => {
    try {
      const url = this.props.uiSchema['ui:data']
      const res = await axios.get(url)

      const { options, dataMap } = this.normalizeData(res.data)

      if (options.length === 0) {
        this.setState({
          error: 'No valid options found in the data',
          isLoading: false
        })
        return
      }

      this.setState({ options, dataMap, isLoading: false })

      // Find placeholder based on current form data
      this.updatePlaceholder(options)
    } catch (error) {
      console.error('Failed to load options:', error)
      this.setState({ error: error.message, isLoading: false })
    }
  }

  updatePlaceholder = (options) => {
    const formData = this.props.formData

    // Handle data format 1.
    if (typeof formData === 'string') {
      const option = options.find(o => o.value === formData)
      if (option) {
        this.setState({ placeholder: option.label })
      } else {
        this.setState({ placeholder: formData })
      }
    // Handle data format 2.
    } else if (typeof formData === 'object' && formData !== null) {
      const option = options.find(o => o.value === formData.identifier)
      if (option) {
        this.setState({ placeholder: option.label })
      } else {
        this.setState({ placeholder: formData.name })
      }
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
      return <label htmlFor={this.props.id} className='text-danger form-label select-required'>{title}*</label>
    } else if (required) {
      return <label htmlFor={this.props.id} className='form-label select-required select-filled'>{title}*</label>
    }

    return <label htmlFor={this.props.id} className='form-label'>{title}</label>
  }

  handleChange = (event) => {
    if (event?.value) {
      const fullData = this.state.dataMap[event.value]

      // Determine if we should return an object or just the value.
      if (this.props.schema && this.props.schema.properties &&
          'identifier' in this.props.schema.properties) {
        this.props.onChange({
          identifier: fullData?.identifier ?? null,
          name: fullData?.name ?? event.value,
          affiliation_name: fullData?.affiliation_name ?? null,
          affiliation_ror: fullData?.affiliation_ror ?? null
        })
      } else {
        this.props.onChange(event.value)
      }
    } else {
      this.props.onChange('')
    }
  }

  render () {
    const help = this.props.uiSchema['ui:help']
    const required = this.props.required

    // Check if this field is part of an array.
    const isArrayItem = this.props.title && /-\d+$/.test(this.props.title)

    return (
      <div>
        {!isArrayItem && this.getLabel()}
        <CreatableSelect
          className='select-box mb-1'
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
