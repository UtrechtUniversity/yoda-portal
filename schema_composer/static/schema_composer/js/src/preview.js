/* global bootstrap */
import React from 'react'
import { createRoot } from 'react-dom/client'

function Preview ({ schema }) {
  return (
    <pre className='mb-0 schema-preview'>
      {JSON.stringify(schema, null, 2)}
    </pre>
  )
}

window.previewBuildingBlock = function (schema, description) {
  const container = document.getElementById('building-block-preview')

  createRoot(container).render(
    <Preview schema={schema} />
  )

  document.getElementById('building-block-preview-description').textContent = description || ''

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById('building-block-preview-modal')
  ).show()
}
