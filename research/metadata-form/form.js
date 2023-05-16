import _Object$keys from "@babel/runtime-corejs3/core-js-stable/object/keys";
import _Object$getOwnPropertySymbols from "@babel/runtime-corejs3/core-js-stable/object/get-own-property-symbols";
import _Object$getOwnPropertyDescriptor from "@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptor";
import _Object$getOwnPropertyDescriptors from "@babel/runtime-corejs3/core-js-stable/object/get-own-property-descriptors";
import _Object$defineProperties from "@babel/runtime-corejs3/core-js-stable/object/define-properties";
import _Object$defineProperty from "@babel/runtime-corejs3/core-js-stable/object/define-property";
import _Reflect$construct from "@babel/runtime-corejs3/core-js-stable/reflect/construct";
import _asyncToGenerator from "@babel/runtime-corejs3/helpers/esm/asyncToGenerator";
import _assertThisInitialized from "@babel/runtime-corejs3/helpers/esm/assertThisInitialized";
import _classCallCheck from "@babel/runtime-corejs3/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime-corejs3/helpers/esm/createClass";
import _inherits from "@babel/runtime-corejs3/helpers/esm/inherits";
import _possibleConstructorReturn from "@babel/runtime-corejs3/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime-corejs3/helpers/esm/getPrototypeOf";
import _defineProperty from "@babel/runtime-corejs3/helpers/esm/defineProperty";
import _slicedToArray from "@babel/runtime-corejs3/helpers/esm/slicedToArray";
import _regeneratorRuntime from "@babel/runtime-corejs3/regenerator";
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = _Reflect$construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !_Reflect$construct) return false; if (_Reflect$construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(_Reflect$construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
import "core-js/modules/es.regexp.exec.js";
import "core-js/modules/es.string.replace.js";
import "core-js/modules/es.function.name.js";
import "core-js/modules/es.symbol.js";
import "core-js/modules/es.symbol.description.js";
import "core-js/modules/es.object.to-string.js";
function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); enumerableOnly && (symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var _context15, _context16; var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? _forEachInstanceProperty(_context15 = ownKeys(Object(source), !0)).call(_context15, function (key) { _defineProperty(target, key, source[key]); }) : _Object$getOwnPropertyDescriptors ? _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)) : _forEachInstanceProperty(_context16 = ownKeys(Object(source))).call(_context16, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } return target; }
import _indexOfInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/index-of";
import _forEachInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/for-each";
import _includesInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/includes";
import _filterInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/filter";
import _mapInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/map";
import _bindInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/bind";
import _startsWithInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/starts-with";
import _concatInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/concat";
import _Array$isArray from "@babel/runtime-corejs3/core-js-stable/array/is-array";
import React, { useState } from "react";
import { render } from "react-dom";
import Form from '@rjsf/bootstrap-4';
import Select from 'react-select';
import validator from '@rjsf/validator-ajv8';
import Geolocation from "./Geolocation";
import Vocabulary from "./Vocabulary";
import ROR from "./ROR";
var _useState = useState(schema),
  _useState2 = _slicedToArray(_useState, 2),
  schema = _useState2[0],
  setSchema = _useState2[1];
var _useState3 = useState(uiSchema),
  _useState4 = _slicedToArray(_useState3, 2),
  uiSchema = _useState4[0],
  setUiSchema = _useState4[1];
var path = $('#form').attr('data-path');
var yodaFormData = {};
var formProperties;
var saving = false;
var form = document.getElementById('form');
var onSubmit = function onSubmit(_ref) {
  var formData = _ref.formData;
  return submitData(formData);
};

// TODO: refactor widgets to subdirectory
var enumWidget = function enumWidget(props) {
  var _context2;
  var enumArray = props['schema']['enum'];
  var enumNames = props['schema']['enumNames'];
  if (enumNames == null) enumNames = enumArray;
  var i = _indexOfInstanceProperty(enumArray).call(enumArray, props['value']);
  var placeholder = enumNames[i] == null ? ' ' : enumNames[i];
  var title = props.label || props.uiSchema["ui:title"];
  var label = /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, title);
  var customStyles = {
    control: function control(styles) {
      return _objectSpread(_objectSpread({}, styles), {}, {
        border: '1px solid #ced4da',
        boxShadow: 'none',
        '&:hover': {
          border: '1px solid #ced4da'
        }
      });
    }
  };
  var required = props.required;
  var error = "should be equal to one of the allowed values";

  // Intervene handling of Required attribute as determined by React
  var list = props.id.replace('yoda_', '').split('_');
  var name_hierarchy = [],
    level_counter = 0,
    level_name = '',
    last_was_numeric = false;

  // Determination of actual field name is based on seperation of id by numbers (which are introduced by React)
  // Example (first level only) Ancillary_Equipment_0
  // Example 2: Contact_0_Person_Identifier_Scheme consists of 2 fields
  // This way an array can be constructed listing the hierachy of names leading up the id of the field
  _forEachInstanceProperty(list).call(list, function (item, index) {
    if (isNaN(item)) {
      last_was_numeric = false;
      level_name = level_name + (level_name.length ? '_' : '') + item;
    } else {
      last_was_numeric = true;
      name_hierarchy[level_counter] = level_name;
      level_counter++;
      level_name = '';
    }
  });

  // If the final item was not numeric, it is not yet added to the name_hierarchy array
  // Therefore, do it now explicitely
  if (!last_was_numeric) {
    name_hierarchy[level_counter] = level_name;
  }

  // Only perform a correction for highest level select fields (i.e. length == 1)
  if (name_hierarchy.length == 1) {
    var _context;
    // Determine actual value for required from top level required list within the jsonschema
    required = _includesInstanceProperty(_context = formProperties.data.schema.required).call(_context, name_hierarchy[0]);
  }
  if (props.rawErrors !== undefined && _indexOfInstanceProperty(_context2 = props.rawErrors).call(_context2, error) >= 0 || required && props.value == null) {
    label = /*#__PURE__*/React.createElement("label", {
      className: "text-danger form-label select-required"
    }, title, "*");
    customStyles = {
      control: function control(styles) {
        return _objectSpread(_objectSpread({}, styles), {}, {
          border: '1px solid #dc3545',
          boxShadow: 'none',
          '&:hover': {
            border: '1px solid #dc3545'
          }
        });
      }
    };
  } else if (required) {
    label = /*#__PURE__*/React.createElement("label", {
      className: "form-label select-required select-filled"
    }, title, "*");
  }
  return /*#__PURE__*/React.createElement("div", null, label, /*#__PURE__*/React.createElement(Select, {
    className: 'select-box',
    placeholder: placeholder,
    required: required,
    isDisabled: props.readonly,
    onChange: function onChange(event) {
      return props.onChange(event.value);
    },
    options: props['options']['enumOptions'],
    styles: customStyles
  }));
};
var widgets = {
  SelectWidget: enumWidget
};
var fields = {
  geo: Geolocation,
  vocabulary: Vocabulary,
  ror: ROR
};

// TODO: refactor templates to subdirectory
var CustomErrorListTemplate = function CustomErrorListTemplate(props) {
  var errors = props.errors,
    formContext = props.formContext;
  errors = _filterInstanceProperty(errors).call(errors, function (e) {
    return e.name !== 'required' && e.name !== 'dependencies';
  });
  if (errors.length === 0) {
    return /*#__PURE__*/React.createElement("div", null);
  } else {
    // Show error list only on save.
    if (formContext.saving) {
      return /*#__PURE__*/React.createElement("div", {
        className: "mb-4 card border-danger"
      }, /*#__PURE__*/React.createElement("div", {
        className: "alert-danger card-header"
      }, "Validation warnings"), /*#__PURE__*/React.createElement("div", {
        className: "p-0 card-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "list-group"
      }, _mapInstanceProperty(errors).call(errors, function (error, i) {
        return /*#__PURE__*/React.createElement("div", {
          key: i,
          className: "border-0 list-group-item"
        }, /*#__PURE__*/React.createElement("span", null, error.stack));
      }))));
    } else {
      return /*#__PURE__*/React.createElement("div", null);
    }
  }
};
var CustomArrayFieldTemplate = function CustomArrayFieldTemplate(props) {
  var DescriptionField = props.DescriptionField,
    readonly = props.readonly,
    disabled = props.disabled;
  if (disabled) {
    var _context3;
    var output = _mapInstanceProperty(_context3 = props.items).call(_context3, function (element, i) {
      // Disabled view
      if (disabled) {
        return element.children;
      }
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "hide"
    }, output);
  } else {
    var _context4;
    var buttonClass = "col-sm-2 offset-sm-10 array-item-add text-right";
    if (props.uiSchema["ui:description"] || props.schema.description) {
      buttonClass = "col-sm-2 array-item-add text-right";
    }
    return /*#__PURE__*/React.createElement("fieldset", {
      className: "yoda-array-field border rounded mb-4"
    }, props.title && /*#__PURE__*/React.createElement("legend", null, props.title), /*#__PURE__*/React.createElement("div", {
      className: "d-flex"
    }, (props.uiSchema["ui:description"] || props.schema.description) && /*#__PURE__*/React.createElement("small", {
      className: "col-sm-10 text-muted form-text mb-2"
    }, props.uiSchema["ui:description"] || props.schema.description), !readonly && props.canAdd && /*#__PURE__*/React.createElement("p", {
      className: buttonClass
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-outline-secondary btn-sm",
      onClick: props.onAddClick,
      type: "button"
    }, /*#__PURE__*/React.createElement("i", {
      className: "fa-solid fa-plus",
      "aria-hidden": "true"
    })))), props.items && _mapInstanceProperty(_context4 = props.items).call(_context4, function (el) {
      return /*#__PURE__*/React.createElement("div", {
        key: el.key,
        className: "d-flex"
      }, /*#__PURE__*/React.createElement("div", {
        className: "col-lg-10 col-10"
      }, el.children), !readonly && /*#__PURE__*/React.createElement("div", {
        className: "py-4 col-lg-2 col-2 mt-2"
      }, /*#__PURE__*/React.createElement("div", {
        className: "d-flex flex-row"
      }, el.hasMoveUp && /*#__PURE__*/React.createElement("div", {
        className: "m-0 p-0"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-light btn-sm",
        type: "button",
        tabindex: "-1",
        onClick: el.onReorderClick(el.index, el.index - 1)
      }, /*#__PURE__*/React.createElement("i", {
        className: "fa-solid fa-arrow-up",
        "aria-hidden": "true"
      }))), el.hasMoveDown && /*#__PURE__*/React.createElement("div", {
        className: "m-0 p-0"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-light btn-sm",
        type: "button",
        tabindex: "-1",
        onClick: el.onReorderClick(el.index, el.index + 1)
      }, /*#__PURE__*/React.createElement("i", {
        className: "fa-solid fa-arrow-down",
        "aria-hidden": "true"
      }))), el.hasRemove && /*#__PURE__*/React.createElement("div", {
        className: "m-0 p-0"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-light btn-sm",
        type: "button",
        tabindex: "-1",
        onClick: el.onDropIndexClick(el.index)
      }, /*#__PURE__*/React.createElement("i", {
        className: "fa-solid fa-trash",
        "aria-hidden": "true"
      }))))));
    }));
  }
};
var CustomObjectFieldTemplate = function CustomObjectFieldTemplate(props) {
  var _context6;
  var TitleField = props.TitleField,
    DescriptionField = props.DescriptionField;
  var structureClass;
  var structure;
  if ('yoda:structure' in props.schema) {
    structureClass = "yoda-structure ".concat(props.schema['yoda:structure']);
    structure = props.schema['yoda:structure'];
  }
  if (structure === 'compound') {
    var _context5;
    var output = _mapInstanceProperty(_context5 = props.properties).call(_context5, function (prop, i) {
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "col compound-field"
      }, prop.content);
    });
    if (props.title) {
      return /*#__PURE__*/React.createElement("fieldset", {
        className: "yoda-array-field border rounded mb-4"
      }, /*#__PURE__*/React.createElement("legend", null, props.title), /*#__PURE__*/React.createElement("div", {
        className: "d-flex"
      }, output, " "));
    } else {
      return /*#__PURE__*/React.createElement("div", {
        className: "d-flex"
      }, output);
    }
  }
  return /*#__PURE__*/React.createElement("fieldset", {
    className: "mb-3"
  }, (props.uiSchema["ui:title"] || props.title) && /*#__PURE__*/React.createElement(TitleField, {
    id: "".concat(props.idSchema.$id, "__title"),
    title: props.title || props.uiSchema["ui:title"],
    required: props.required,
    formContext: props.formContext
  }), (props.uiSchema["ui:description"] || props.schema.description) && /*#__PURE__*/React.createElement("small", {
    className: "col-xs-12 text-muted form-text"
  }, props.uiSchema["ui:description"] || props.schema.description), /*#__PURE__*/React.createElement("div", {
    className: "container-fluid p-0"
  }, _mapInstanceProperty(_context6 = props.properties).call(_context6, function (prop) {
    return /*#__PURE__*/React.createElement("div", {
      className: "col-xs-12",
      key: prop.content.key
    }, prop.content);
  })));
};
var CustomFieldTemplate = function CustomFieldTemplate(props) {
  var id = props.id,
    classNames = props.classNames,
    label = props.label,
    help = props.help,
    hidden = props.hidden,
    required = props.required,
    description = props.description,
    errors = props.errors,
    rawErrors = props.rawErrors,
    children = props.children,
    displayLabel = props.displayLabel,
    formContext = props.formContext,
    readonly = props.readonly;
  if (hidden || !displayLabel) {
    return children;
  }

  // Only show error messages after submit.
  if (formContext.saving) {
    return /*#__PURE__*/React.createElement("div", {
      className: classNames + ' row'
    }, /*#__PURE__*/React.createElement("div", {
      className: 'col-12 field-wrapper'
    }, /*#__PURE__*/React.createElement("div", {
      className: 'form-group mb-0'
    }, /*#__PURE__*/React.createElement("div", {
      className: 'mb-0 form-group'
    }, children, help && /*#__PURE__*/React.createElement("small", {
      className: "text-muted form-text"
    }, help), description)), errors));
  } else {
    return /*#__PURE__*/React.createElement("div", {
      className: classNames + ' row'
    }, /*#__PURE__*/React.createElement("div", {
      className: 'col-12 field-wrapper'
    }, /*#__PURE__*/React.createElement("div", {
      className: 'form-group mb-0'
    }, /*#__PURE__*/React.createElement("div", {
      className: 'mb-0 form-group'
    }, children, help && /*#__PURE__*/React.createElement("small", {
      className: "text-muted form-text"
    }, help), description))));
  }
};
var templates = {
  ArrayFieldTemplate: CustomArrayFieldTemplate,
  FieldTemplate: CustomFieldTemplate,
  ObjectFieldTemplate: CustomObjectFieldTemplate,
  ErrorListTemplate: CustomErrorListTemplate
};
var YodaForm = /*#__PURE__*/function (_React$Component) {
  _inherits(YodaForm, _React$Component);
  var _super = _createSuper(YodaForm);
  function YodaForm(props) {
    var _this;
    _classCallCheck(this, YodaForm);
    _this = _super.call(this, props);
    var formContext = {
      saving: false
    };
    _this.state = {
      formData: yodaFormData,
      formContext: formContext
    };
    return _this;
  }
  _createClass(YodaForm, [{
    key: "onChange",
    value: function onChange(form) {
      updateCompleteness();

      // Turn save mode off.
      saving = false;
      var formContext = {
        saving: false
      };
      this.setState({
        formData: form.formData,
        formContext: formContext
      });
    }
  }, {
    key: "onError",
    value: function onError(form) {
      var formContext = _objectSpread({}, this.state.formContext);
      formContext.saving = saving;
      this.setState({
        formContext: formContext
      });
    }
  }, {
    key: "transformErrors",
    value: function transformErrors(errors) {
      // Strip errors when saving.
      if (saving) {
        return _filterInstanceProperty(errors).call(errors, function (e) {
          return e.name !== 'required' && e.name !== 'dependencies' && e.name !== 'enum' && e.name !== 'type';
        });
      }
      return errors;
    }
  }, {
    key: "render",
    value: function render() {
      var _context7,
        _context8,
        _this2 = this,
        _React$createElement;
      return /*#__PURE__*/React.createElement(Form, (_React$createElement = {
        className: "metadata-form",
        schema: schema,
        idPrefix: "yoda",
        uiSchema: uiSchema,
        fields: fields,
        widgets: widgets,
        formData: this.state.formData,
        formContext: this.state.formContext,
        liveValidate: true,
        noValidate: false,
        noHtml5Validate: true,
        showErrorList: "top",
        templates: templates,
        onSubmit: onSubmit
      }, _defineProperty(_React$createElement, "widgets", widgets), _defineProperty(_React$createElement, "onChange", _bindInstanceProperty(_context7 = this.onChange).call(_context7, this)), _defineProperty(_React$createElement, "onError", _bindInstanceProperty(_context8 = this.onError).call(_context8, this)), _defineProperty(_React$createElement, "validator", validator), _defineProperty(_React$createElement, "transformErrors", this.transformErrors), _React$createElement), /*#__PURE__*/React.createElement("button", {
        ref: function ref(btn) {
          _this2.submitButton = btn;
        },
        className: "hidden"
      }));
    }
  }]);
  return YodaForm;
}(React.Component);
var YodaButtons = /*#__PURE__*/function (_React$Component2) {
  _inherits(YodaButtons, _React$Component2);
  var _super2 = _createSuper(YodaButtons);
  function YodaButtons(props) {
    _classCallCheck(this, YodaButtons);
    return _super2.call(this, props);
  }
  _createClass(YodaButtons, [{
    key: "renderSaveButton",
    value: function renderSaveButton() {
      return /*#__PURE__*/React.createElement("button", {
        onClick: this.props.saveMetadata,
        type: "submit",
        className: "btn btn-primary float-start"
      }, "Save");
    }
  }, {
    key: "renderDeleteButton",
    value: function renderDeleteButton() {
      return /*#__PURE__*/React.createElement("button", {
        onClick: deleteMetadata,
        type: "button",
        className: "btn btn-danger delete-all-metadata-btn float-end"
      }, "Delete all metadata ");
    }
  }, {
    key: "renderCloneButton",
    value: function renderCloneButton() {
      return /*#__PURE__*/React.createElement("button", {
        onClick: this.props.cloneMetadata,
        type: "button",
        className: "btn btn-primary clone-metadata-btn float-end"
      }, "Clone from parent folder");
    }
  }, {
    key: "renderFormCompleteness",
    value: function renderFormCompleteness() {
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
        className: "text-sm float-start text-muted text-center ms-3 mt-1"
      }, "Required for the vault:"), /*#__PURE__*/React.createElement("div", {
        className: "form-completeness progress float-start ms-3 mt-2 w-25",
        "data-bs-toggle": "tooltip",
        title: ""
      }, /*#__PURE__*/React.createElement("div", {
        className: "progress-bar bg-success"
      })));
    }
  }, {
    key: "renderButtons",
    value: function renderButtons() {
      var buttons = [];
      if (formProperties.data.can_edit) {
        buttons.push(this.renderSaveButton());
        buttons.push(this.renderFormCompleteness());

        // Delete and clone are mutually exclusive.
        if (formProperties.data.metadata !== null) buttons.push(this.renderDeleteButton());else if (formProperties.data.can_clone) buttons.push(this.renderCloneButton());
      }
      return /*#__PURE__*/React.createElement("div", null, buttons);
    }
  }, {
    key: "render",
    value: function render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "form-group"
      }, /*#__PURE__*/React.createElement("div", {
        className: "row yodaButtons"
      }, /*#__PURE__*/React.createElement("div", {
        className: "col-sm-12"
      }, this.renderButtons())));
    }
  }]);
  return YodaButtons;
}(React.Component);
var Container = /*#__PURE__*/function (_React$Component3) {
  _inherits(Container, _React$Component3);
  var _super3 = _createSuper(Container);
  function Container(props) {
    var _context9;
    var _this3;
    _classCallCheck(this, Container);
    _this3 = _super3.call(this, props);
    _this3.saveMetadata = _bindInstanceProperty(_context9 = _this3.saveMetadata).call(_context9, _assertThisInitialized(_this3));
    return _this3;
  }
  _createClass(Container, [{
    key: "saveMetadata",
    value: function saveMetadata() {
      saving = true;
      this.form.submitButton.click();
    }
  }, {
    key: "cloneMetadata",
    value: function cloneMetadata() {
      swal({
        title: "Are you sure?",
        text: "Entered metadata will be overwritten by cloning.",
        type: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ffcd00",
        confirmButtonText: "Yes, clone metadata!",
        closeOnConfirm: false,
        animation: false
      }, /*#__PURE__*/function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(isConfirm) {
          return _regeneratorRuntime.wrap(function _callee$(_context10) {
            while (1) switch (_context10.prev = _context10.next) {
              case 0:
                if (!isConfirm) {
                  _context10.next = 4;
                  break;
                }
                _context10.next = 3;
                return Yoda.call('meta_clone_file', {
                  target_coll: Yoda.basePath + path
                }, {
                  errorPrefix: 'Metadata could not be cloned'
                });
              case 3:
                window.location.reload();
              case 4:
              case "end":
                return _context10.stop();
            }
          }, _callee);
        }));
        return function (_x) {
          return _ref2.apply(this, arguments);
        };
      }());
    }
  }, {
    key: "render",
    value: function render() {
      var _this4 = this;
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(YodaButtons, {
        saveMetadata: this.saveMetadata,
        deleteMetadata: deleteMetadata,
        cloneMetadata: this.cloneMetadata
      }), /*#__PURE__*/React.createElement(YodaForm, {
        ref: function ref(form) {
          _this4.form = form;
        }
      }), /*#__PURE__*/React.createElement(YodaButtons, {
        saveMetadata: this.saveMetadata,
        deleteMetadata: deleteMetadata,
        cloneMetadata: this.cloneMetadata
      }));
    }
  }]);
  return Container;
}(React.Component);
;
function loadForm() {
  // Inhibit "loading" text.
  formLoaded = true;
  Yoda.call('meta_form_load', {
    coll: Yoda.basePath + path
  }, {
    rawResult: true
  }).then(function (data) {
    formProperties = data;
    if (formProperties.data !== null) {
      // These ary only present when there is a form to show (i.e. no
      // validation errors, and no transformation needed).
      setSchema(formProperties.data.schema);
      setUiSchema(formProperties.data.uischema);
      yodaFormData = formProperties.data.metadata === null ? undefined : formProperties.data.metadata;
    }
    if (formProperties.status === 'error_transformation_needed') {
      // Transformation is necessary. Show transformation prompt.
      $('#transformation-text').html(formProperties.data.transformation_html);
      if (formProperties.data.can_edit) {
        $('#transformation-buttons').removeClass('hide');
        $('#transformation-text').html(formProperties.data.transformation_html);
      } else {
        $('#transformation .close-button').removeClass('hide');
      }
      $('.transformation-accept').on('click', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        return _regeneratorRuntime.wrap(function _callee2$(_context11) {
          while (1) switch (_context11.prev = _context11.next) {
            case 0:
              $('.transformation-accept').attr('disabled', true);
              _context11.next = 3;
              return Yoda.call('transform_metadata', {
                coll: Yoda.basePath + path,
                keep_metadata_backup: $('#cb-keep-metadata-backup').is(":checked")
              }, {
                errorPrefix: 'Metadata could not be transformed'
              });
            case 3:
              window.location.reload();
            case 4:
            case "end":
              return _context11.stop();
          }
        }, _callee2);
      })));
      $('#transformation').removeClass('hide');
    } else if (formProperties.status !== 'ok') {
      // Errors exist - show those instead of loading a form.
      var text = '';
      if (formProperties.status === 'error_validation') {
        // Validation errors? show a list.
        $.each(formProperties.data.errors, function (key, field) {
          text += '<li>' + $('<div>').text(field.replace('->', '→')).html();
        });
      } else {
        // Structural / misc error? Show status info.
        text += '<li>' + $('<div>').text(formProperties.status_info).html();
      }
      $('.delete-all-metadata-btn').on('click', deleteMetadata);
      $('#form-errors .error-fields').html(text);
      $('#form-errors').removeClass('hide');
    } else if (formProperties.data.metadata === null && !formProperties.data.can_edit) {
      // No metadata present and no write access. Do not show a form.
      $('#metadata-form').removeClass('hide');
      $('#form').addClass('hide');
      if (formProperties.data.is_locked) {
        $('#no-metadata-and-locked').removeClass('hide');
      } else {
        $('#no-metadata').removeClass('hide');
      }
    } else {
      // Metadata present or user has write access, load the form.
      if (!formProperties.data.can_edit) uiSchema['ui:readonly'] = true;
      render( /*#__PURE__*/React.createElement(Container, null), document.getElementById('form'));

      // Form may already be visible (with "loading" text).
      if ($('#metadata-form').hasClass('hide')) {
        // Avoid flashing things on screen.
        $('#metadata-form').fadeIn(220);
        $('#metadata-form').removeClass('hide');
      }

      // Specific required textarea handling
      $('textarea').each(function () {
        if ($(this).attr('required')) {
          // initial setting when form is opened
          if ($(this).val() == '') {
            $(this).addClass('is-invalid');
          }
          // following changes in the required textarea and adjust border status
          $(this).on("change keyup paste", function () {
            if ($(this).val() == '') {
              if (!$(this).hasClass('is-invalid')) {
                $(this).addClass('is-invalid');
              }
            } else {
              $(this).removeClass('is-invalid');
            }
          });
        }
      });
      updateCompleteness();
    }
  });
}
$(function (_) {
  return loadForm();
});
function submitData(_x2) {
  return _submitData.apply(this, arguments);
}
/**
 * Returns to the browse view for the current collection.
 */
function _submitData() {
  _submitData = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(data) {
    var property, unfiltered, filtered;
    return _regeneratorRuntime.wrap(function _callee3$(_context14) {
      while (1) switch (_context14.prev = _context14.next) {
        case 0:
          // Disable buttons.
          $('.yodaButtons button').attr('disabled', true);

          // Remove empty arrays and array items when saving.
          for (property in data) {
            if (_Array$isArray(data[property])) {
              unfiltered = data[property];
              filtered = _filterInstanceProperty(unfiltered).call(unfiltered, function (e) {
                return e;
              });
              if (filtered.length === 0) {
                delete data[property];
              } else {
                data[property] = filtered;
              }
            }
          }

          // Save.
          _context14.prev = 2;
          _context14.next = 5;
          return Yoda.call('meta_form_save', {
            coll: Yoda.basePath + path,
            metadata: data
          }, {
            errorPrefix: 'Metadata could not be saved'
          });
        case 5:
          Yoda.store_message('success', "Updated metadata of folder <".concat(path, ">"));
          browse();
          _context14.next = 12;
          break;
        case 9:
          _context14.prev = 9;
          _context14.t0 = _context14["catch"](2);
          // Allow retry.
          $('.yodaButtons button').attr('disabled', false);
        case 12:
        case "end":
          return _context14.stop();
      }
    }, _callee3, null, [[2, 9]]);
  }));
  return _submitData.apply(this, arguments);
}
function browse() {
  window.location.href = '/research/browse?dir=' + encodeURIComponent(path);
}
function updateCompleteness() {
  var _context13;
  var mandatoryTotal = 0;
  var mandatoryFilled = 0;
  $(".form-control").each(function () {
    var _context12;
    if ($(this)[0].required && !_startsWithInstanceProperty(_context12 = $(this)[0].id).call(_context12, "yoda_links_")) {
      mandatoryTotal++;
      if ($(this)[0].value != "") {
        mandatoryFilled++;
      }
    }
  });
  $(".select-required").each(function () {
    mandatoryTotal++;
  });
  $(".select-filled").each(function () {
    mandatoryFilled++;
  });
  var percent = mandatoryFilled / mandatoryTotal * 100;
  $(".form-completeness .progress-bar").css('width', percent + '%');
  $('.form-completeness').attr('title', _concatInstanceProperty(_context13 = "Required for the vault: ".concat(mandatoryTotal, ", currently filled required fields: ")).call(_context13, mandatoryFilled));
  return mandatoryTotal == mandatoryFilled;
}
