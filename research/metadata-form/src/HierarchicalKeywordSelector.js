import React from 'react'
import axios from 'axios'
import { TreeSelect, ConfigProvider, theme } from 'antd'

class HierarchicalKeywordSelector extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      ...props.formData,
      // Keyword array in the expected format
      value: [],
      treeData: null
    }

    // Check what theme is set
    this.colorMode = props.formContext.colorMode
    this.colorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bs-primary')
    this.lightModeSelectColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-black')
    this.lightModeSelectBgColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-secondary-bg')
    // From react-select theming
    this.darkModeSelectColor = '#dee2e6'
    this.darkModeSelectBgColor = props.formContext.darkThemeColors.primary25
  }

  async loadData () {
    const url = this.props.uiSchema['ui:data']
    const res = await axios(url)
    return await res.data
  }

  componentDidMount () {
    let newVal = []
    if (this.props.formData) {
      newVal = this.props.formData.map((keyObj) => {
        if (Object.keys(keyObj).includes('valueURI')) {
          return { label: keyObj.Subject, value: [keyObj.Subject, keyObj.valueURI].join(':') }
        } else {
          return { label: keyObj.Subject, value: keyObj.Subject + ':' }
        }
      })
    }

    if (!this.state.treeData) {
      this.loadData().then(data => {
        const initialTreeData = this.createTreeSelectFromJson(data)
        const userKeywords = this.getUserKeywords(newVal)
        const userKeywordTree = this.createUserKeywordTree(userKeywords)

        this.setState({
          treeData: initialTreeData.concat(userKeywordTree),
          value: newVal
        })
      })
    }
  }

  getUserKeywords = (keywords) => {
    return keywords.filter((keyword) => (keyword.value.endsWith(':')))
  }

  createUserKeywordTree = (keywords) => {
    // Given user keywords, create a User keyword tree
    const newUserCreatedTree = [{
      title: 'User created keywords',
      value: 'userCreated'
      // If disabled is true, pressing enter does not select the keyword.
      // "disabled": true,
    }]

    if (keywords.length) {
      newUserCreatedTree[0].children = keywords.map((keyword) => ({ title: keyword.label, value: keyword.value }))
      return newUserCreatedTree
    } else {
      return []
    }
  }

  createTreeSelectFromJson = (jsonA) => {
    const newTreeJson = []
    for (const index in jsonA) {
      const tree = jsonA[index]
      const newTree = {}
      newTree.value = tree.text + ':' + tree.extra.uri
      newTree.title = tree.text

      if ('children' in tree) {
        newTree.children = this.createTreeSelectFromJson(tree.children)
      }
      newTreeJson.push(newTree)
    }
    return newTreeJson
  }

  putCheckOnParents = (treeJson, item) => {
    /* Recursively go down the tree to find the selected (one) item
       After hitting the base case, traverse back up to the root of the tree,
       selecting all parents and ancestors
    */
    for (const i in treeJson) {
      const tree = treeJson[i]
      // Skip selecting user created tree
      if (tree.value === 'userCreated') {
        return false
      }

      if (tree.value === item) {
        return true
      }

      if ('children' in tree) {
        if (this.putCheckOnParents(tree.children, item)) {
          this.setState((state) => {
            // Also confirm that it isn't already checked
            if (!state.value.some((keyword) => keyword.value === tree.value)) {
              return { value: state.value.concat([{ label: tree.title, value: tree.value }]) }
            }
            return {}
          })
          // if we found the item, don't need to visit other branches
          return true
        }
      }
    }
    return false
  }

  handleSelect = (newValue) => {
    // Find the new node
    this.putCheckOnParents(this.state.treeData, newValue)
  }

  handleChange = (newValue) => {
    const userKeywords = this.getUserKeywords(newValue)
    const newUserCreatedTree = this.createUserKeywordTree(userKeywords)

    this.setState((state) => {
      const treeNoUserCreated = state.treeData.filter((tree) => (tree.value !== 'userCreated'))
      return {
        treeData: treeNoUserCreated.concat(newUserCreatedTree),
        // Remove userCreated, should not be selectable
        value: newValue.filter((keyword) => keyword.value !== 'userCreated')
      }
    },
    () => this.props.onChange(this.state))
  }

  handleSearch = (keyword) => {
    this.setState((state) => {
      const userKeywords = this.getUserKeywords(state.value)
      const keyValue = keyword + ':'
      // Don't add if it is a duplicate
      if (!userKeywords.some((key) => key.value === keyValue)) {
        userKeywords.push({ label: keyword, value: keyValue })
      }
      const newUserCreatedTree = this.createUserKeywordTree(userKeywords)
      return {
        treeData: state.treeData.filter((tree) => (tree.value !== 'userCreated')).concat(newUserCreatedTree)
      }
    })
  }

  render () {
    return (
      <div className='col-12 field-wrapper'>
        <div className='form-group mb-0'>
          <div className='mb-0 form-group keyword-selector'>
            <label className='w-100'>{this.props.schema.title}</label>
            <ConfigProvider
              theme={{
                algorithm: this.colorMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: this.colorMode === 'dark'
                  ? {
                      colorPrimary: '#ffffff',
                      // Copied from our react-select dark mode theme
                      colorBgContainer: this.props.formContext.darkThemeColors.neutral0,
                      colorBgContainerDisabled: this.props.formContext.darkThemeColors.neutral0,
                      colorBgElevated: this.props.formContext.darkThemeColors.neutral0
                    }
                  : {
                      colorPrimary: this.colorPrimary
                    // colorPrimaryBorder: this.colorPrimary,
                    // colorPrimary: "#000000",
                    },
                components: {
                  TreeSelect: this.colorMode === 'dark'
                    ? {
                        nodeSelectedColor: this.darkModeSelectColor,
                        nodeSelectedBg: this.darkModeSelectBgColor,
                        nodeHoverColor: this.darkModeSelectColor,
                        nodeHoverBg: this.darkModeSelectBgColor
                      }
                    : {
                        nodeSelectedColor: this.lightModeSelectColor,
                        nodeSelectedBg: this.lightModeSelectBgColor,
                        nodeHoverColor: this.lightModeSelectColor,
                        nodeHoverBg: this.lightModeSelectBgColor
                      }
                }
              }}
            >
              <TreeSelect
                labelInValue
                showSearch
                style={{
                  width: '100%'
                }}
                // dropdownStyle={{
                //   maxHeight: 400,
                //   overflow: 'auto',
                // }}
                value={this.state.value}
                placeholder='Select keyword'
                placement='bottomLeft'
                allowClear
                multiple
                disabled={this.props.readonly}
                onChange={this.handleChange}
                onSearch={this.handleSearch}
                onSelect={this.handleSelect}
                size='large'
                treeData={this.state.treeData}
              />
            </ConfigProvider>
            <small className='text-muted form-text'>
              <small className='text-muted form-text'>
                {this.props.uiSchema['ui:description']}
              </small>
            </small>
          </div>
        </div>
      </div>
    )
  }
}

export default HierarchicalKeywordSelector
