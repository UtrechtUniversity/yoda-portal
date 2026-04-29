import React from 'react'

const CustomFieldTemplate = (props) => {
  const { id, classNames, label, help, hidden, required, description, errors, rawErrors, children, displayLabel, formContext } = props

  // Hide field entirely if needed.
  if (hidden || !displayLabel) {
    return children
  }

  // Check if this field is part of an array.
  const isArrayItem = id && /_\d+$/.test(id)
  const hasErrors = Array.isArray(rawErrors) && rawErrors.length > 0
  const shouldShowErrors = formContext?.saving && hasErrors

  return (
    <div className={`${classNames} row`}>
      <div className='col-12 field-wrapper'>
        <div className='form-group mb-0'>
          {!isArrayItem && (
            <label htmlFor={id} className={hasErrors ? 'text-danger' : ''}>
              {label}
              {required && '*'}
            </label>
          )}
          {children}
          {help && <small className='text-muted form-text'>{help}</small>}
          {description && <div className='form-text'>{description}</div>}
          {shouldShowErrors && errors}
        </div>
      </div>
    </div>
  )
}

export default CustomFieldTemplate
