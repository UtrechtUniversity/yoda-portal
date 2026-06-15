import React from 'react'

const CustomArrayFieldTemplate = (props) => {
  const { readonly, disabled, required, title, items, canAdd, uiSchema, schema, onAddClick, rawErrors } = props

  // Disabled view - just display items.
  if (disabled) {
    return (
      <div className='hide'>
        {items.map((el) => el.children)}
      </div>
    )
  }

  const description = uiSchema['ui:description'] || schema.description
  const isStringField = (el) => {
    const type = el.schema.type
    return (type === 'string' || (Array.isArray(type) && type.includes('string'))) || el.uiSchema?.['ui:field'] === 'vocabulary'
  }
  const actionSpacingClass = (el) => (isStringField(el) ? 'mt-1' : 'mt-2 py-4')
  const hasErrors = Array.isArray(rawErrors) && rawErrors.length > 0

  return (
    <fieldset className='yoda-array-field border rounded mb-4'>
      {title && (
        <legend className={hasErrors ? 'text-danger' : ''}>
          {title}
          {required && '*'}
        </legend>
      )}

      <div className='d-flex'>
        {description && (
          <small className='col-sm-10 text-muted form-text mb-2'>
            {description}
          </small>
        )}

        {!readonly && canAdd && (
          <div className='col-sm-2 ms-auto px-3'>
            <button
              className='btn btn-outline-secondary btn-sm'
              type='button'
              onClick={onAddClick}
              aria-label='Add item'
            >
              <i className='fa-solid fa-plus' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>

      {items && items.map((el) => (
        <div key={el.key} className='d-flex'>
          <div className='col-lg-10 col-10'>
            {el.children}
          </div>
          {!readonly && (
            <div className={`col-lg-2 col-2 ${actionSpacingClass(el)}`}>
              <div className='d-flex flex-row'>
                {el.hasMoveUp && (
                  <button
                    className='btn btn-outline-secondary btn-sm'
                    type='button'
                    onClick={el.onReorderClick(el.index, el.index - 1)}
                    aria-label='Move up'
                  >
                    <i className='fa-solid fa-arrow-up' aria-hidden='true' />
                  </button>
                )}

                {el.hasMoveDown && (
                  <button
                    className='btn btn-outline-secondary btn-sm'
                    type='button'
                    onClick={el.onReorderClick(el.index, el.index + 1)}
                    aria-label='Move down'
                  >
                    <i className='fa-solid fa-arrow-down' aria-hidden='true' />
                  </button>
                )}

                {el.hasRemove && items.length > 1 && (
                  <button
                    className='btn btn-outline-secondary btn-sm'
                    type='button'
                    onClick={el.onDropIndexClick(el.index)}
                    aria-label='Remove item'
                  >
                    <i className='fa-solid fa-trash' aria-hidden='true' />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </fieldset>
  )
}

export default CustomArrayFieldTemplate
