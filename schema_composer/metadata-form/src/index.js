import React from 'react'
import { createRoot } from 'react-dom/client'
import Form from '@rjsf/bootstrap-4'
import { customizeValidator } from '@rjsf/validator-ajv8'
import Ajv2019 from 'ajv/dist/2019'
import Ajv2020 from 'ajv/dist/2020'
import Select from 'react-select'

import AffiliationIdentifier from 'YodaFields/AffiliationIdentifier'
import CustomArrayFieldTemplate from 'YodaTemplates/CustomArrayFieldTemplate'
import CustomErrorListTemplate from 'YodaTemplates/CustomErrorListTemplate'
import CustomFieldTemplate from 'YodaTemplates/CustomFieldTemplate'
import CustomObjectFieldTemplate from 'YodaTemplates/CustomObjectFieldTemplate'
import Geolocation from 'YodaFields/Geolocation'
import KeywordInput from 'YodaFields/KeywordInput'
import TreeKeywordSelector from 'YodaFields/TreeKeywordSelector'
import PersonIdentifier from 'YodaFields/PersonIdentifier'
import Vocabulary from 'YodaFields/Vocabulary'

let schema = window.previewSchema
let uiSchema = window.previewUiSchema

console.log('PREVIEW SCHEMA:', schema)
console.log('PREVIEW UI SCHEMA:', uiSchema)
console.log('PREVIEW UI SCHEMA TYPE:', typeof uiSchema)

let validator

const validatorAjvDraft7 = customizeValidator({ ajvOptionsOverrides: { verbose: true, addUsedSchema: false } })
const validatorAjv2019 = customizeValidator({ AjvClass: Ajv2019, ajvOptionsOverrides: { verbose: true, addUsedSchema: false } })
const validatorAjv2020 = customizeValidator({ AjvClass: Ajv2020, ajvOptionsOverrides: { verbose: true, addUsedSchema: false } })

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
    * One of the few bootstrap variables we can use with theming react-select!
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
  primary75: '#2b3035'
}

const enumWidget = (props) => {
  const enumArray = props.schema.enum
  let enumNames = props.schema.enumNames
  const placeholderString = props.uiSchema['ui:placeholder']

  if (enumNames == null) { enumNames = enumArray }

  const i = enumArray.indexOf(props.value)
  const placeholder = enumNames[i] == null ? (placeholderString || ' ') : enumNames[i]

  let customStyles = {
    control: (styles) => ({
      ...styles,
      border: colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da',
      boxShadow: 'none',
      '&:hover': {
        border: colorMode === 'dark' ? '1px solid #495057' : '1px solid #ced4da'
      }
    })
  }

  // Check what theme is set
  const colorMode = props.formContext.colorMode

  let required = props.required
  const error = 'should be equal to one of the allowed values'

  // Intervene handling of Required attribute as determined by React
  const list = props.id.replace('yoda_', '').split('_')
  const nameHierarchy = []; let levelCounter = 0; let levelName = ''; let lastWasNumeric = false

  // Determination of actual field name is based on separation of id by numbers (which are introduced by React)
  // Example (first level only) Ancillary_Equipment_0
  // Example 2: Contact_0_Person_Identifier_Scheme consists of 2 fields
  // This way an array can be constructed listing the hierarchy of names leading up the id of the field
  list.forEach(function (item, index) {
    if (isNaN(item)) {
      lastWasNumeric = false
      levelName = levelName + ((levelName.length) ? '_' : '') + item
    } else {
      lastWasNumeric = true
      nameHierarchy[levelCounter] = levelName
      levelCounter++
      levelName = ''
    }
  })

  // If the final item was not numeric, it is not yet added to the name_hierarchy array
  // Therefore, do it now explicitly
  if (!lastWasNumeric) {
    nameHierarchy[levelCounter] = levelName
  }

  // Only perform a correction for highest level select fields (i.e. length == 1)
  if (nameHierarchy.length === 1) {
    // Determine actual value for required from top level required list within the jsonschema
    required = schema.required && schema.required.includes(nameHierarchy[0])
  }

  // will hold classes (select-required, select-filled) as indications for totalization purposes.
  // For that purpose element <selectTotals> will be added.
  let selectCompletenessClasses = ''

  if ((props.rawErrors !== undefined && props.rawErrors.indexOf(error) >= 0) || (required && props.value == null)) {
    // Indicate that this element is required and should be counted as total
    selectCompletenessClasses = 'select-required'
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
    // Indicate that this element is required and holds a value
    selectCompletenessClasses = 'select-required select-filled'
  }

  return (
    <div>
      <selectTotals className={selectCompletenessClasses} />
      <Select
        className='select-box'
        placeholder={placeholder}
        required={required}
        isDisabled={props.readonly}
        onChange={(event) => props.onChange(event.value)}
        options={props.options.enumOptions}
        styles={customStyles}
        theme={(theme) => ({
          ...theme,
          colors: (colorMode === 'dark') ? { ...theme.colors, ...props.formContext.darkThemeColors } : { ...theme.colors }
        })}
      />
    </div>
  )
}

const widgets = {
  SelectWidget: enumWidget
}

const fields = {
  geo: Geolocation,
  vocabulary: Vocabulary,
  affiliation_identifier: AffiliationIdentifier,
  person_identifier: PersonIdentifier,
  keyword_input: KeywordInput,
  tree_keyword_selector: TreeKeywordSelector
}

const templates = {
  ArrayFieldTemplate: CustomArrayFieldTemplate,
  ObjectFieldTemplate: CustomObjectFieldTemplate,
  ErrorListTemplate: CustomErrorListTemplate,
  FieldTemplate: CustomFieldTemplate
}

class YodaForm extends React.Component {
  constructor (props) {
    super(props)
    this.formRef = React.createRef()

    const formContext = {
      saving: false,
      colorMode: document.documentElement.getAttribute('data-bs-theme'),
      darkThemeColors
    }

    this.state = {
      formData: undefined,
      formContext
    }
  }

  onChange (form, id) {
    const formContext = { ...this.state.formContext }

    // Update TreeKeyword field if it exists and was the one changed
    if (id === 'yoda_TreeKeyword' &&
            form.formData.TreeKeyword &&
            form.formData.TreeKeyword.value &&
            form.formData.TreeKeyword.value.length &&
            Object.keys(form.schema.properties.TreeKeyword.items.properties).includes('subject')) {
      form.formData.TreeKeyword = this.updateTreeKeywords(form, form.formData.TreeKeyword.value)
    }

    this.setState({
      formData: form.formData,
      formContext
    })
  }

  updateTreeKeywords = (form, value) => {
    const newVal = value.map(val => {
      if (val.value.endsWith(':')) {
        // User created keyword
        return {
          subject: val.label
        }
      } else {
        return {
          subject: val.label,
          subjectScheme: form.uiSchema.TreeKeyword['ui:subjectScheme'],
          schemeUri: 'ui:schemeUri' in form.uiSchema.TreeKeyword
            ? form.uiSchema.TreeKeyword['ui:schemeUri']
            : val.value.split(':').slice(1).join(':').split('/').slice(0, -1).join('/') + '/',
          valueUri: val.value.split(':').slice(1).join(':')
        }
      }
    })
    return newVal
  }

  render () {
    console.log('RJSF schema:', schema)
    console.log('RJSF uiSchema:', uiSchema)
    return (
      <Form
        ref={this.formRef}
        className='metadata-form'
        schema={schema}
        idPrefix='yoda'
        uiSchema={uiSchema}
        fields={fields}
        formData={this.state.formData}
        formContext={this.state.formContext}
        liveValidate
        noValidate={false}
        noHtml5Validate
        showErrorList='top'
        widgets={widgets}
        templates={templates}
        omitExtraData
        onChange={this.onChange.bind(this)}
        validator={validator}
      >
        <button className='hidden' />
      </Form>
    )
  }
}

validator = validatorAjv2020

if (schema.$schema === 'http://json-schema.org/draft-07/schema') {
  validator = validatorAjvDraft7
} else if (schema.$schema === 'https://json-schema.org/draft/2019-09/schema') {
  validator = validatorAjv2019
}

document.addEventListener('DOMContentLoaded', function () {
  const formElement = document.getElementById('form')

  if (formElement) {
    const root = createRoot(formElement)
    root.render(<YodaForm />)
  }
})
