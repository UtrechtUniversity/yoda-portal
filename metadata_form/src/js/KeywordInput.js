import React from 'react'
import PropTypes from 'prop-types'
import { ConfigProvider, theme, Tag } from 'antd'

class KeywordInput extends React.Component {
  static propTypes = {
    formData: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object.isRequired,
    formContext: PropTypes.object.isRequired,
    rawErrors: PropTypes.array.isRequired,
    required: PropTypes.bool.isRequired,
    readonly: PropTypes.bool.isRequired
  }

  lightTokenTheme = {
    colorPrimary: '#007bff',
    colorTextBase: '#000000',
    colorBgContainer: '#ffffff'
  }

  darkTokenTheme = {
    colorPrimary: '#0d6efd',
    colorTextBase: '#f8f9fa',
    colorBgContainer: '#212529'
  }

  constructor (props) {
    super(props)

    this.inputRef = React.createRef()
    let initialKeywords = []
    if (props.formData && Array.isArray(props.formData)) {
      initialKeywords = props.formData.filter(x => x && typeof x === 'string')
    }

    this.state = {
      keywords: initialKeywords,
      inputValue: '',
      colorMode: props.formContext?.colorMode || 'light'
    }
  }

  componentDidMount () {
    // Retrieve CSS variables from the DOM (DOM must be ready).
    const styles = window.getComputedStyle(document.documentElement)
    const primaryColor = styles.getPropertyValue('--bs-primary').trim() || '#007bff'
    const textColor = styles.getPropertyValue('--bs-black').trim() || '#000000'
    const secondaryBgColor = styles.getPropertyValue('--bs-secondary-bg').trim() || '#e9ecef'

    this.setState({
      primaryColor,
      textColor,
      secondaryBgColor
    })
  }

  componentDidUpdate (prevProps, prevState) {
    // Compare against actual state to prevent infinite loops.
    const newKeywords = Array.isArray(this.props.formData)
      ? this.props.formData.filter(x => x && typeof x === 'string')
      : []

    if (JSON.stringify(prevState.keywords) !== JSON.stringify(newKeywords)) {
      this.setState({ keywords: newKeywords })
    }

    if (prevProps.formContext?.colorMode !== this.props.formContext?.colorMode) {
      this.setState({ colorMode: this.props.formContext?.colorMode || 'light' })
    }
  }

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value })
  }

  handleInputBlur = () => {
    const trimmed = this.state.inputValue.trim()
    if (trimmed && trimmed !== this.state.inputValue) {
      this.setState({ inputValue: trimmed })
    }
  }

  handleKeyDown = (e) => {
    if (e.key === 'Enter' && this.state.inputValue.trim()) {
      e.preventDefault()
      this.addKeyword(this.state.inputValue.trim())
    }
  }

  addKeyword = (keyword) => {
    if (!keyword) return

    const newKeywords = [...this.state.keywords]
    if (!newKeywords.includes(keyword)) {
      newKeywords.push(keyword)
      this.setState(
        { keywords: newKeywords, inputValue: '' },
        () => this.props.onChange(newKeywords)
      )
    } else {
      this.setState({ inputValue: '' })
    }
  }

  removeKeyword = (index) => {
    const newKeywords = this.state.keywords.filter((_, i) => i !== index)
    this.setState({ keywords: newKeywords }, () => this.props.onChange(newKeywords))
  }

  fieldNeedsAttention = () => {
    return (
      (this.props.rawErrors && this.props.rawErrors.length > 0) ||
      (this.props.required &&
        (!Array.isArray(this.state.keywords) || !this.state.keywords.length))
    )
  }

  render () {
    const title = this.props.schema.title || this.props.uiSchema?.['ui:title']
    const description = this.props.uiSchema?.['ui:description']
    const hasErrors = this.props.rawErrors && this.props.rawErrors.length > 0

    return (
      <div className='col-12 field-wrapper'>
        <fieldset className='yoda-array-field border rounded mb-4'>
          <legend>{title}{this.props.required ? '*' : ''}</legend>
          <div className='d-flex'>
            <div className='col-12 form-group mb-1'>
              {description && (
                <small className='text-muted form-text mb-2'>
                  {description}
                </small>
              )}
              <input
                ref={this.inputRef}
                type='text'
                className={`form-control mb-2 ${this.fieldNeedsAttention() ? 'is-invalid' : ''}`}
                placeholder='Enter keyword and press Enter'
                value={this.state.inputValue}
                onChange={this.handleInputChange}
                onBlur={this.handleInputBlur}
                onKeyDown={this.handleKeyDown}
                disabled={this.props.readonly}
                aria-label={`Add ${title}`}
                aria-describedby={hasErrors ? `${title}-errors` : undefined}
              />
              {hasErrors && (
                <div id={`${title}-errors`} className='text-danger mt-2'>
                  {this.props.rawErrors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}
              {this.state.keywords.length > 0 && (
                <div>
                  <ConfigProvider
                    theme={{
                      algorithm:
                        this.state.colorMode === 'dark'
                          ? theme.darkAlgorithm
                          : theme.defaultAlgorithm,
                      token:
                        this.state.colorMode === 'dark'
                          ? this.darkTokenTheme
                          : this.lightTokenTheme
                    }}
                  >
                    {this.state.keywords.map((keyword, index) => (
                      <Tag
                        key={keyword}
                        closable={!this.props.readonly}
                        onClose={() => this.removeKeyword(index)}
                        style={{
                          fontSize: '14px',
                          padding: '6px 12px',
                          height: 'auto'
                        }}
                      >
                        {keyword}
                      </Tag>
                    ))}
                  </ConfigProvider>
                </div>
              )}
            </div>
          </div>
        </fieldset>
      </div>
    )
  }
}

export default KeywordInput
