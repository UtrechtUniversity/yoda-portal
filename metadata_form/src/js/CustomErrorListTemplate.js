import React from 'react'

const CustomErrorListTemplate = (props) => {
  const { errors = [], formContext = {} } = props
  const IGNORED_ERROR_NAMES = ['required', 'dependencies']
  const filteredErrors = errors.filter((error) => !IGNORED_ERROR_NAMES.includes(error.name))

  if (filteredErrors.length === 0 || !formContext.saving) {
    return null
  }

  return (
    <div className='mb-4 card border-danger'>
      <div className='alert-danger card-header'>Validation warnings</div>
      <div className='p-0 card-body'>
        <div className='list-group'>
          {filteredErrors.map((error) => (
            <div key={error.instancePath || error.stack} className='border-0 list-group-item'>
              <span>{error.stack}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CustomErrorListTemplate
