import React from "react";
import Modal from 'react-modal';
import axios from "axios";

var self = null;
let json = {};

const customModalStyles = {
    content : {
        top                   : '50%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)',
        width                 : '70%',
        height                : '625px',
    }
};

class KeywordSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.formData
        };

        const url = 'https://raw.githubusercontent.com/UtrechtUniversity/yoda-ruleset/epos-msl/vocabularies/epos-msl-keywords.json';
        const loadData = async () => {
            await axios.get(url).then((res) => {
                this.json = res.data;
            });
        };
        loadData();

        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.afterOpenModal = this.afterOpenModal.bind(this);
        this.addKeyword = this.addKeyword.bind(this);
    }

    openModal(e) {
        e.preventDefault();

        this.showModal = true;
        this.setState(this.state);
    }

    closeModal(e) {
        e.preventDefault();

        this.showModal = false;
        this.setState(this.state);
    }

    afterOpenModal(e) {
        self = this;

        $.jstree.defaults.core.themes.responsive = true;

        $('#tree').jstree({
            plugins: ["checkbox", "wholerow", "search"],
            "types": {
                "file": {
                    "icon": "jstree-file"
                }
            },
            'core': {
                'data': this.json
            },
            checkbox: {
                three_state : false, // to avoid that fact that checking a node also check others
                whole_node : false,  // to avoid checking the box just clicking the node
                tie_selection : false // for checking without selecting and selecting without checking
            },
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
            }
        })
        .on("check_node.jstree uncheck_node.jstree", function(e, data) {
            data.node.parents.forEach((element) => {
                $('#tree').jstree('check_node', element);
            });

            if(e.type == "check_node") {
                self.addItem(data.node);
            } else if (e.type == "uncheck_node") {
                self.removeItem(data.node);
            }
        });

        $(document).ready(function () {
            $("#search-input").keyup(function () {
                var searchString = $(this).val();
                $('#tree').jstree('search', searchString);
            });
        });
    }

    addKeyword(keyword, valueUri) {
        this.setState({"keywords": [
                {"keyword": keyword, "valueURI": valueUri}
        ]}, () => this.props.onChange(this.state));
    }

    addItem(node) {
        $("#modal-list-group").append(
            '<li class="list-group-item" id="modal-list-group-item-' + node.id +'">' + node.text + '<a href="#" id="modal-list-group-item-delete-' + node.id + '" title="remove keyword"><i class="bi bi-x text-danger"></i></a></li>'
        );

        $('#modal-list-group-item-delete-' + node.id).bind("click", function(){
            $('#modal-list-group-item-' + node.id).remove();
            $("#tree").jstree("uncheck_node", node.id);
        });

        this.addKeyword(node.text, node.original.extra.uri);
    }

    removeItem(node) {
        $('#modal-list-group-item-' + node.id).remove();
    }

    render() {
        return (
            <div className='col-12 field-wrapper'>
                <div className='form-group mb-0'>
                    <div className='mb-0 form-group keyword-selector'>
                        <label className='w-100'>{this.props.schema.title}</label>
                        <button className='btn btn-outline-secondary' type='button' tabIndex='-1'
                                onClick={(e) => {
                                    this.openModal(e);
                                }}>Select keywords
                        </button>
                        <Modal
                            isOpen={this.showModal}
                            onAfterOpen={this.afterOpenModal}
                            onRequestClose={this.closeModal}
                            style={customModalStyles}
                            ariaHideApp={false}
                        >
                            <div class='container-fluid'>
                                <div class='row'>
                                    <div class='col-md-12'>
                                        <div class='input-group'>
                                            <input id='search-input' class='form-control' placeholder='Search for keyword...' />
                                        </div>
                                    </div>
                                </div>
                                <hr />
                                <div class='row'>
                                    <div class='col-md-6'>
                                        <div id="tree"></div>
                                    </div>
                                    <div class='col-md-6'>
                                        <ul class='list-group' id='modal-list-group'>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </Modal>
                        <small className="text-muted form-text">
                            <small className="text-muted form-text">
                                {this.props.uiSchema["ui:description"]}
                            </small>
                        </small>
                        {this.props.formData.Keywords &&
                         this.props.formData.Keywords.map(el => (
                        <div>test</div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default KeywordSelector;
