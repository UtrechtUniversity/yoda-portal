import React from 'react'

const CustomObjectFieldTemplate = (props) => {
  const structure = props.schema['yoda:structure']
  const description = props.uiSchema['ui:description'] || props.schema.description

  if (structure === 'compound') {
    const output = props.properties.map((prop) => (
      <div key={prop.content.key} className='col compound-field'>
        {prop.content}
      </div>
    ))

    if (props.title) {
      return (
        <fieldset className='yoda-array-field border rounded mb-4'>
          <legend>{props.title}</legend>
          {description && (
            <div className='d-flex'>
              <small className='col-sm-10 text-muted form-text mb-2'>{description}</small>
            </div>
          )}
          <div className='d-flex'>{output}</div>
        </fieldset>
      )
    }

    return <div className='d-flex'>{output}</div>
  }

  return (
    <fieldset className='mb-3'>
      {description && (
        <small className='col-xs-12 text-muted form-text'>{description}</small>
      )}
      <div className='container-fluid p-0'>
        {props.properties.map((prop) => (
          <div className='col-xs-12' key={prop.content.key}>
            {prop.content}
          </div>
        ))}
      </div>
    </fieldset>
  )
}

export default CustomObjectFieldTemplate
