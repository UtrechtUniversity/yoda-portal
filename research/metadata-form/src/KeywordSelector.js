import React from "react";
import axios from "axios";
import { TreeSelect, ConfigProvider, theme } from 'antd';


class KeywordSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        ...props.formData,
        value: [],
        treeData: null
    };

    // Check what theme is set
    // TODO should this be a prop passed down from index.js?
    this.colorMode = document.documentElement.getAttribute('data-bs-theme');
    this.colorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bs-primary');
    this.lightModeSelectColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-black');
    this.lightModeSelectBgColor = getComputedStyle(document.documentElement).getPropertyValue('--bs-secondary-bg');
    // From react-select theming
    this.darkModeSelectColor = "#dee2e6";
    this.darkModeSelectBgColor = '#2b3035';
  }

  async loadData() {
    const url = 'https://raw.githubusercontent.com/UtrechtUniversity/msl_vocabularies/refs/heads/main/vocabularies/combined/editor/1.3/editor_1-3.json';
    const res = await axios(url);
    return await res.data;
  }

  componentDidMount () {
    const newVal = this.props.formData ? this.props.formData.map((keyObj) => ({"label": keyObj.Subject, "value": [keyObj.Subject, keyObj.valueURI].join(":")})) : []
    if (!this.state.treeData) {
      this.loadData().then(data => this.setState({
        treeData: this.createTreeSelectFromJson(data),
        value: newVal
      }))
    }
  }

  createTreeSelectFromJson = (jsonA) => {
    const newTreeJson = []
    for (const index in jsonA) {
      const tree = jsonA[index]
      const newTree = {}
      newTree["value"] = tree["text"] + ":" + tree["extra"]["uri"]
      newTree["title"] = tree["text"]

      if ('children' in tree) {
        newTree["children"] = this.createTreeSelectFromJson(tree['children'])
      }
      newTreeJson.push(newTree)
    }
    return newTreeJson
  }

  putCheckOnParents = (treeJson, item, selected) => {
    /* Recursively go down the tree to find the selected (one) item
       After hitting the base case, traverse back up to the root of the tree,
       selecting all parents and ancestors
    */
    for (const i in treeJson) {
      const tree = treeJson[i]

      if (tree.value === item.value) {
        return true
      }

      if ('children' in tree) {
        if (this.putCheckOnParents(tree["children"], item, selected)) {
          selected.push({"label": tree["title"], "value": tree["value"]})
          // if we found the item, don't need to visit other branches
          return true
        }
      }
    }
    return false
  }


  onChange = (newValue) => {
    if (newValue.length > this.state.value.length) {
      // Find the new node
      const newNodes = newValue.filter(({value: id2}) => !this.state.value.some(({value: id1}) => id2 === id1))
      this.putCheckOnParents(this.state.treeData, newNodes[0], newValue)
    }

    this.setState({
        "value": newValue
    },
    () => this.props.onChange(this.state));
  }

  render() {
    return (
        <div className='col-12 field-wrapper'>
            <div className='form-group mb-0'>
                <div className='mb-0 form-group keyword-selector'>
                    <label className='w-100'>{this.props.schema.title}</label>
                    <ConfigProvider
                      theme={{
                        algorithm: this.colorMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
                        token: this.colorMode === 'dark'? {
                          // Copied from our react-select dark mode theme
                          colorPrimary: '#495057',
                          colorBgContainer: "#212529",
                          colorBgContainerDisabled: "#212529",
                          colorBgElevated: "#212529",
                        } : {
                          colorPrimary: this.colorPrimary,
                        },
                        components: {
                          TreeSelect: {
                            nodeSelectedColor: this.colorMode === 'dark' ? this.darkModeSelectColor : this.lightModeSelectColor,
                            nodeSelectedBg: this.colorMode === 'dark' ? this.darkModeSelectBgColor : this.lightModeSelectBgColor,
                            nodeHoverColor: this.colorMode === 'dark' ? this.darkModeSelectColor : this.lightModeSelectColor,
                            nodeHoverBg: this.colorMode === 'dark' ? this.darkModeSelectBgColor : this.lightModeSelectBgColor,
                          },
                        },
                      }}
                    >
                      <TreeSelect
                          labelInValue
                          showSearch
                          style={{
                            width: '100%',
                          }}
                          // dropdownStyle={{
                          //   maxHeight: 400,
                          //   overflow: 'auto',
                          // }}
                          value={this.state.value}
                          placeholder="Select keyword"
                          placement="bottomLeft"
                          allowClear
                          multiple
                          disabled={this.props.readonly}
                          onChange={this.onChange}
                          size="large"
                          treeData={this.state.treeData}
                      />
                    </ConfigProvider>
                    <small className="text-muted form-text">
                        <small className="text-muted form-text">
                            {this.props.uiSchema["ui:description"]}
                        </small>
                    </small>
                </div>
            </div>
        </div>
    );
  }
}

export default KeywordSelector;
