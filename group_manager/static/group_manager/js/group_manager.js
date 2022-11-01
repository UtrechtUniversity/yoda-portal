/**
 * \file
 * \brief     Yoda Group Manager frontend.
 * \author    Chris Smeele
 * \copyright Copyright (c) 2015-2022, Utrecht University
 * \license   GPLv3, see LICENSE
 */

"use strict";

function readCsvFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    var contents = e.target.result;

    //remove unwanted characters
    contents = contents.replaceAll('"', '').replaceAll("'", '').replaceAll(' ', '');

    // ensure correct seperator ','
    contents = contents.replaceAll(';', ',');

    // required to be able to, in a simple manner, add header and data row to the tr's in the table to pass to the backend
    const csv_header = contents.slice(0, contents.indexOf("\n"));
    const csv_rows = contents.slice(contents.indexOf("\n") + 1).split("\n");
    var csv_rows_corrected = [];

    // parse the csv file data to be able to present in a table
    var result = csvToArray(contents);

    // first row will contain fixed definion
    var ar_keys = result[0];

    // First compress all columns to  keys: category, subcategory, groupname and usercount
    const presentation_columns = ['groupname', 'category', 'subcategory', 'users'];
    const all_csv_columns = ['groupname', 'category', 'subcategory', 'manager', 'member', 'viewer']

    var new_result = [];
    var row_nr = 0;
    result.forEach(function myFunction(group_def) {
        // initialise all columns that must be present in the view
        var row = [];
        presentation_columns.forEach(function myFunction(column) {
            row[column] = '';
        });

        // now loop through the received rows and put them in the right columns
        for (const key of Object.keys(ar_keys)) {
            all_csv_columns.forEach(function myFunction(column) {
                if (key == column) {
                    row[column] = group_def[key];
                }
                else if (key.startsWith(column)) {
                    if (group_def[key] != '\r') {
                        if (row['users'] == '') {
                            row['users'] = '1';
                        }
                        else {
                            row['users'] = (parseInt(row['users']) + 1).toString();
                        }
                    }
                }
            });
        }
        // only show row when all required data is present.
        var row_error = false;
        presentation_columns.forEach(function myFunction(column) {
            if (!row_error && (row[column] === undefined || row[column] == '')) {
                row_error = true;
            }
        });
        if (row_error == false) {
            new_result.push(row);
            csv_rows_corrected.push(csv_rows[row_nr]);
        }
        row_nr += 1;
    });

    // build the header row of the table
    let table = '<table class="table table-striped"><thead><tr><th></th>'
    presentation_columns.forEach(function myFunction(column) {
        table += '<th>' + column + '</th>';
    });
    table += '<td></td></tr></thead><tbody>';

    new_result.forEach(function myFunction(group_def, i) {
        table += '<tr id="' + group_def['groupname'] + '" class="import-groupname" groupname="' + group_def['groupname'] + '" import_row_data="' + csv_header + "\n" + csv_rows_corrected[i] + '">';
        table += '<td id="processed-indicator-' + group_def['groupname'] + '"></td>';
        presentation_columns.forEach(function myFunction(column) {
            table += '<td>' + group_def[column] + '</td>';
        });
        table += '<td id="error-import-' + group_def['groupname'] + '"></td>';
        table += '</tr>';
    });

    table += '</tbody></table>';
    $('#result-import-groups-csv').html(table);

    // now have user choose to actually process the uploaded data.
    $('.div-process-results-import').removeClass('hidden');

    // enable processing again after successful reading
    $('.process-csv').prop('disabled', false);
  };
  reader.readAsText(file);
}

function csvToArray(str, delimiter = ",") {
      const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
      const rows = str.slice(str.indexOf("\n") + 1).split("\n");

      const arr = rows.map(function (row) {
        const values = row.split(delimiter);
        const el = headers.reduce(function (object, header, index) {
          object[header] = values[index];
          return object;
        }, {});
        return el;
      });

      return arr;
}

async function process_imported_row(row) {
    // Row specific processing of the imported csv
    var groupname = row.attr('groupname');
    var import_row_data = row.attr('import_row_data');

    try {
        await Yoda.call('group_process_csv',
            {csv_header_and_data: import_row_data,
             allow_update: $('#import-allow-updates').is(':checked'),
             delete_users: $('#import-delete-users').is(':checked')},
            {"quiet": true}).then((data) => {

            // Successful import -> set correct classes and feedback to inform user
            row.addClass('import-groupname-done');
            $('#processed-indicator-' + groupname).html('<i class="fa-solid fa-check"></i>');
            row.addClass('import-csv-group-ok');

            // Solely added for test automation - splinter.
            // This was the only way to be able to perform an automated click work on a row.
            // in itself this functionality is superfluous - as it is dealt with in $('.import-csv-group-ok').click(function() {}
            $('#processed-indicator-' + groupname).click(function(){
                let groupName = 'research-' + groupname
                $('#dlg-import-groups-csv').modal('hide');
                Yoda.groupManager.unfoldToGroup(groupName);
                Yoda.groupManager.selectGroup(groupName);
            });
        });
    }
    catch(error) {
        // Row processing encountered problems => inform user and add appropriate classes.
        row.addClass('import-groupname-done');

        $('#processed-indicator-' + groupname).html('<i class="fa-solid fa-circle-exclamation"></i>');
        row.addClass('table-danger');
        // collect error messages and maken 1 string to present to user.
        var error_html = '';
        error.status_info.forEach(function myFunction(item) {
            error_html += item + '<br/>';
        });
        $('#error-import-' + groupname).html(error_html);
    }
    // if all is complete reload the left pane with data and setup click capability to open newly added groups in the groupmananger
    if ($('.import-groupname').length == $('.import-groupname-done').length) {
        // only enable new groups that have been successfully added
        $('.import-csv-group-ok').click(function() {
            let groupName = 'research-' + $(this).attr('groupname');
            $('#dlg-import-groups-csv').modal('hide');
            Yoda.groupManager.unfoldToGroup(groupName);
            Yoda.groupManager.selectGroup(groupName);
        });

        // Renew the data of the left pane as new groups have been added not yet loaded.
        Yoda.call('group_data').then((groupdata) => {
            Yoda.groupManager.groupHierarchy = groupdata['group_hierarchy']

            // Collect the latest data and bring into Yoda.groupManager.groups
            Yoda.groupManager.groups = (function(hier) {
                var groups = { };
                for (var categoryName in hier) {
                    for (var subcategoryName in hier[categoryName]) {
                        for (var groupName in hier[categoryName][subcategoryName]) {
                            groups[groupName] = {
                                category:    categoryName,
                                subcategory: subcategoryName,
                                name:        groupName,
                                description: hier[categoryName][subcategoryName][groupName].description,
                                schema_id: hier[categoryName][subcategoryName][groupName].schema_id,
                                data_classification: hier[categoryName][subcategoryName][groupName].data_classification,
                                members:     hier[categoryName][subcategoryName][groupName].members
                            };

                        }
                    }
                }
                return groups;
            })(groupdata['group_hierarchy']);

            var cat_idx = 1;
            var html = '';
            var subcat_idx = 1;
            var grp_idx = 1;
            for (var category in groupdata['group_hierarchy']) {
                            html += `<div class="list-group-item category" id="category-${ cat_idx }" data-name="${ category }">
                                        <a class="name collapsed" data-bs-toggle="collapse" data-parent="#category-${ cat_idx }" href="#category-${ cat_idx }-ul">
                                            <i class="fa-solid fa-caret-right triangle" aria-hidden="true"></i> ${ category }
                                        </a>
                                        <div class="list-group collapse category-ul" id="category-${ cat_idx }-ul">`;
                            subcat_idx = 1;
                            for (var subcat in groupdata['group_hierarchy'][category]) {
                                html +=

                                `<div class="list-group-item subcategory" data-name="${ subcat }">
                                    <a class="name collapsed" data-bs-toggle="collapse" data-parent="#subcategory-${ subcat_idx }" href="#subcategory-${ subcat_idx }-ul">
                                        <i class="fa-solid fa-caret-right triangle" aria-hidden="true"></i> ${ subcat }
                                    </a>
                                    <div class="list-group collapse subcategory-ul" id="subcategory-${ subcat_idx }-ul">`;

                                grp_idx = 1;
                                for (var group in groupdata['group_hierarchy'][category][subcat]) {
                                    html +=
                                        `<a class="list-group-item list-group-item-action group" id="group-${ grp_idx }" data-name="${ group }">
                                            ${ group }
                                        </a>`;

                                    grp_idx += 1
                                }

                                html += '</div></div>';
                                subcat_idx = subcat_idx + 1;
                            }

                            html += '</div></div>';
                            cat_idx = cat_idx + 1;
            }
            $('#group-list').html(html);
        });
    }
}


$(function() {
    // CSV import handling {{{
    document.getElementById('file-input').addEventListener('change', readCsvFile, false);

    $('.file-input-click').click(function(){
        $('#file-input').val(null);
    });

    $('.import-groups-csv').click(function(){
        $('#dlg-import-groups-csv').modal('show');
    });

    $('.process-csv').click(function(){
        // First disable the button
        $(this).prop('disabled', true);

        // loop through the rows in the table and, if successful, add a click handler to be able to jump to a group in the groupmananger
        $('.import-groupname').each(function myFunction() {
            process_imported_row($(this));
        });
    });
    // }}}

    // When allowed to add groups the fields have to be initialized
    $('.create-button-new').click(function(){
        $('.properties-update').addClass('hidden');
        $('.users').addClass('hidden');
        $('.properties-create').removeClass('hidden');

        var that = Yoda.groupManager;

        var $prefixDiv = $('#f-group-create-prefix-div');
        $prefixDiv.find('button .text').html(that.GROUP_DEFAULT_PREFIX + '&nbsp;');

        $('#f-group-create-data-classification').val('unspecified').trigger('change');

        $('#f-group-create-prefix-div a[data-value="' + that.GROUP_DEFAULT_PREFIX + '"]').click();

        $('#f-group-create-name')       .val('');
        $('#f-group-create-description').val('');

        $('#f-group-create-prefix-datamanager').addClass('hidden');

        $('#f-group-create-category')   .select2('val', '');
        $('#f-group-create-subcategory').select2('val', '');
        $('#f-group-create-name').focus();
    });

    // Intercept group creation submission of form
    $('#f-group-create-submit').click(function(){
        Yoda.groupManager.onSubmitGroupCreateOrUpdate(this);
    });

    // Intercept group update submission of form
    $('#f-group-update-submit').click(function(){
        Yoda.groupManager.onSubmitGroupCreateOrUpdate(this);
    });

    $('.user-search-groups').click(function(){
        $('#user-search-groups').modal('show');
        if ($('#input-user-search-groups').val().length==0) {
            $('#result-user-search-groups').html('Please enter a username to find groups for.');
            $('#input-user-search-groups').focus();
        }
        else {
            $('#input-user-search-groups').focus().select();
        }
    });
    $('#input-user-search-groups').keypress(function (e) {
        if (e.which == 13) {
            $('.btn-user-search-groups').trigger('click');
            return false;
        }
    });
    $('.btn-user-search-groups').click(function(){
        var hier = Yoda.groupManager.groupHierarchy;
        let username = $('#input-user-search-groups').val() + '#' + Yoda.groupManager.zone;
        var isDatamanager = false;
        var data = []
        for (var categoryName in hier) {
            for (var subcategoryName in hier[categoryName]) {
                for (var groupName in hier[categoryName][subcategoryName]) {
                    if (hier[categoryName][subcategoryName][groupName].members[username] != undefined) {
                        data.push([groupName, hier[categoryName][subcategoryName][groupName].members[username]['access'], categoryName, subcategoryName]);
                    }
                }
            }
        }
        $('#result-user-search-groups').html('');
        if (data.length==0){
            if ($('#input-user-search-groups').val().length==0) {
                $('#result-user-search-groups').html('Please enter a username to find groups for.');
            }
            else {
                $('#result-user-search-groups').html("No groups found for user '" + $('#input-user-search-groups').val() + "'");
            }
            return;
        }

        // Build result table.
        let table = '<table class="table table-striped"><thead><tr><th>Group</th><th>Category</th><th>Subcategory</th></tr></thead><tbody>';
        $.each(data, function(index, usergroup) {
            table += `<tr>
                 <td class="user-search-result-group" style="cursor: pointer"  user-search-result-group="${usergroup[0]}">
                    <i class="fa-solid ${Yoda.groupManager.accessIcons[usergroup[1]]}" title="${Yoda.groupManager.accessNames[usergroup[1]]}"></i>
                    ${usergroup[0]}
                 </td>
                 <td>${usergroup[2]}</td>
                 <td>${usergroup[3]}</td>
            </tr>`;
        });
        table += '</tbody></table>';
        $('#result-user-search-groups').html(table);

        $('.user-search-result-group').click(function() {
             $('#user-search-groups').modal('hide');
             let groupName = $(this).attr('user-search-result-group');
             Yoda.groupManager.unfoldToGroup(groupName);
             Yoda.groupManager.selectGroup(groupName);
        });
    });

    Yoda.groupManager = {

        /**
         * \brief If the amount of visible groups is higher than or equal to this value,
         *        categories in the group list will be folded on page load.
         */
        CATEGORY_FOLD_THRESHOLD: 8,

        /// Group name prefixes that can be shown in the group manager.
        /// NB: To make group prefixes selectable in the group add dialog, the
        /// view phtml must be edited.
        GROUP_PREFIXES_RE:          /^(grp-|priv-|intake-|vault-|research-|deposit-|datamanager-|datarequests-)/,

        /// A subset of GROUP_PREFIXES_RE that cannot be selected for group creation, and that cannot be deleted.
        GROUP_PREFIXES_RESERVED_RE: /^(priv-|vault-)/,

        GROUP_PREFIXES_WITH_DATA_CLASSIFICATION: ['research-', 'intake-'],

        GROUP_PREFIXES_WITH_SCHEMA_ID: ['research-', 'deposit-'],

        /// The default prefix when adding a new group.
        GROUP_DEFAULT_PREFIX:       'research-',

        unloading: false, ///< Set to true when a navigation action is detected. Used for better error reporting.

        groupHierarchy: null, ///< A group hierarchy object. See Yoda.groupManager.load().
        groups:         null, ///< A list of group objects with member information. See Yoda.groupManager.load().

        isRodsAdmin: false, // This will be set in Yoda.groupManager.load().

        zone: null,
        userNameFull: null, ///< The username, including the zone name.

        /// A list of access / membership levels.
        accessLevels: ['reader', 'normal', 'manager'],

        /// Icon classes for access levels.
        accessIcons: {
            'reader':  'fa-eye',
            'normal':  'fa-user',
            'manager': 'fa-user-circle',
        },

        /// Human-readable descriptions of access levels.
        /// These are used in title attrs of membership icons and on Change Role buttons.
        accessNames: {
            'reader':  'Member with read-only access',
            'normal':  'Regular member with write access',
            'manager': 'Group manager',
        },

        // All possible schema-id's
        schemaIDs: [],

        /// Get the name of an access level one lower than the current one for
        /// the given group.
        prevAccessLevel: function(current, groupName) {
            var prev = null;
            var currentI = this.accessLevels.indexOf(current);
            if (currentI)
                prev = this.accessLevels[currentI - 1];

            if (prev == 'reader' && !groupName.match(/^(research|intake)-/) && current == 'normal') {
                // The reader access level is only defined for research and intake groups.
                prev = null;
            }

            return prev;
        },

        /// Get the name of an access level one higher than the current one for
        /// the given group.
        nextAccessLevel: function(current, groupName) {
            var next = null;
            var currentI = this.accessLevels.indexOf(current);
            if (currentI + 1 < this.accessLevels.length)
                next = this.accessLevels[currentI + 1];
            return next;
        },

        getPrefix: function(groupName) {
            var matches = groupName.match(this.GROUP_PREFIXES_RE, '');
            return matches
                //? matches[1].slice(0, -1) // Chop off the '-' ?
                ? matches[1]
                : '';
        },

        prefixHasDataClassification: function(prefix) {
            return this.GROUP_PREFIXES_WITH_DATA_CLASSIFICATION.indexOf(prefix) >= 0;
        },

        prefixHasSchemaId: function(prefix) {
            return this.GROUP_PREFIXES_WITH_SCHEMA_ID.indexOf(prefix) >= 0;
        },

        // Functions that check membership / access status of the
        // client ('the user') {{{

        /**
         * \brief Check if the user is a member of the given group.
         *
         * \param groupName
         *
         * \return
         */
        isMemberOfGroup: function(groupName) {
            return (groupName in this.groups
                    && this.userNameFull in this.groups[groupName].members);
        },

        /**
         * \brief Check if the user is a manager in the given group.
         *
         * \param groupName
         *
         * \return
         */
        isManagerOfGroup: function(groupName) {
            return (this.isMemberOfGroup(groupName)
                    && (this.accessLevels.indexOf(this.groups[groupName]
                                                  .members[this.userNameFull].access)
                        >= this.accessLevels.indexOf('manager')))
        },

        /**
         * \brief Check if the user is allowed to manage the given group.
         *
         * If the user is of type rodsadmin, they do not need to be a
         * manager in the given group to manage it.
         *
         * \param groupName
         *
         * \return
         */
        canManageGroup: function(groupName) {
            return this.isRodsAdmin || this.isManagerOfGroup(groupName);
        },

        /**
         * \brief Try to check if the user is a manager in the given category.
         *
         * Returns false if the user does not have access to the given
         * category.
         *
         * rodsadmin type users are always a manager in any category.
         *
         * \param categoryName
         *
         * \return
         */
        isManagerInCategory: function(categoryName) {
            if (this.isRodsAdmin)
                return true;

            var that = this;
            try {
                var category = this.groupHierarchy[categoryName];
                return Object.keys(category).some(function(subcategoryName) {
                    return Object.keys(category[subcategoryName]).some(function(groupName) {
                        return that.isManagerOfGroup(groupName);
                    });
                });
            } catch (ex) {
                // The category is probably not visible to us.
                return false;
            }
        },

        /**
         * \brief Check whether the user is allowed to create the datamanager
         *        group in the given category.
         *
         * \param categoryName
         *
         * \return
         */
        canCreateDatamanagerGroup: function(categoryName) {

            return (// if the category name can legally be translated to a group name ...
                       categoryName.match(/^([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$/)
                    // ... and the datamanager group does not yet exist ...
                    && !(('datamanager-' + categoryName) in this.groups)
                    // ... and the user is rodsadmin.
                    && this.isRodsAdmin);

            // (previously, priv-category-add was sufficient where we now require rodsadmin)
        },

        // }}}

        /**
         * \brief Execute a function if an AJAX request was not aborted.
         *
         * This is used to inhibit error reporting when the cause of the error
         * was that the user aborted a request.
         *
         * \param result the request result object
         * \param f      the function to call
         */
        ifRequestNotAborted: function(result, f) {
            if (!this.unloading) {
                // Aborted requests are apparently hard to detect reliably.
                // The closest we can get is a detection of an abort caused by
                // navigation (e.g. refreshing the page):
                // https://stackoverflow.com/a/15141116
                //
                // Checking result.status is not sufficient, because we
                // cannot distinguish between aborted requests and network
                // failures.
                // The result.statusText can not be used because its behavior
                // differs between browsers(!), e.g. Firefox will set it to
                // 'error' either way.
                f();
            }
        },

        /**
         * \brief Unfold the category belonging to the given group in the group list.
         *
         * \param groupName
         */
        unfoldToGroup: function(groupName) {
            var $groupList = $('#group-list');

            var $group = $groupList.find('.group[data-name="' + Yoda.escapeQuotes(groupName) + '"]');

            $group.parents('.category').children('a.name').removeClass('collapsed');
            $group.parents('.category').children('.category-ul').removeClass('hidden');
            $group.parents('.category').children('.category-ul').collapse('show');

            if ($group.parents('.category').find('.subcategory').length > 1)  {
                // Unfold subcategory.
                // Skip this if there is only one subcategory. In that case the
                // subcat will be automagically expanded by a
                // 'shown.bs.collapse' event handler.
                // (unfolding twice looks jittery)
                $group.parents('.subcategory').children('a.name').removeClass('collapsed');
                $group.parents('.subcategory').children('.subcategory-ul').removeClass('hidden');
                $group.parents('.subcategory').children('.subcategory-ul').collapse('show');
            }
        },

        updateGroupMemberCount: function(groupName) {
            var $userPanelTitle = $('.card.users .card-title');
            $('#user-group-member-count').text('Group members (' + Object.keys(this.groups[groupName].members).length + ')');
        },

        /**
         * \brief Select the given group in the group list.
         *
         * \param groupName
         */
        selectGroup: function(groupName) {
            var group = this.groups[groupName];
            var userCanManage = this.canManageGroup(groupName);

            var $groupList = $('#group-list');
            var $group     = $groupList.find('.group[data-name="' + Yoda.escapeQuotes(groupName) + '"]');
            var $oldGroup  = $groupList.find('.active');

            if ($group.is($oldGroup))
                return;

            this.deselectGroup();

            this.unfoldToGroup(groupName);

            // handle visibility of correct update cards.
            $('.properties-create').addClass('hidden');
            $('.properties-update').removeClass('hidden');
            $('.users').removeClass('hidden');

            $('#group-properties-group-name').html('<strong>[' + groupName + ']</strong>');

            $oldGroup.removeClass('active');
            $group.addClass('active');
            Yoda.storage.session.set('selected-group', groupName);

            var that = this;

            var $groupPanel = $('.card.groups');
            $('.delete-button').toggleClass(
                'disabled',
                !!(!userCanManage || groupName.match(that.GROUP_PREFIXES_RESERVED_RE)
                   || (groupName.match(/^datamanager-/) && !this.isRodsAdmin))
            );

            // The category of a datamanager group cannot be changed - the
            // category name is part of the group name.
            var canEditCategory = userCanManage && !groupName.match(/^datamanager-/);

            // Build the group properties panel {{{

            (function(){
                var $groupProperties = $('#group-properties');

                $groupProperties.find('.placeholder-text').addClass('hidden');
                $groupProperties.find('form').removeClass('hidden');

                $groupProperties.find('#f-group-update-category')
                    .select2('data', { id: group.category, text: group.category })
                    .select2('readonly', !canEditCategory);
                $groupProperties.find('#f-group-update-subcategory')
                    .select2('data', { id: group.subcategory, text: group.subcategory })
                    .select2('readonly', !userCanManage);
                $groupProperties.find('#inputGroupPrepend')
                    .html(function() {
                        var matches = groupName.match(that.GROUP_PREFIXES_RE, '');
                        return matches
                            ? matches[1]
                            : '&nbsp;&nbsp;';
                    });

                var prefix = that.getPrefix(groupName);

                if (that.prefixHasSchemaId(prefix)) {
                    $groupProperties.find('.schema-id').show();
                    // For now this is a disabled field.
                    $('#f-group-update-schema-id').val(group.schema_id);
                } else {
                    $groupProperties.find('.schema-id').hide();
                }

                $groupProperties.find('#f-group-update-name')
                    .val(groupName.replace(that.GROUP_PREFIXES_RE, ''))
                    .prop('readonly', true)
                    .attr('title', 'Group names cannot be changed')
                    .attr('data-prefix', prefix);
                $groupProperties.find('#f-group-update-description')
                    .val(group.description)
                    .prop('readonly', !userCanManage);

                if (that.prefixHasDataClassification(prefix)) {
                    $groupProperties.find('.data-classification').show();
                    $('#f-group-update-data-classification')
                        .select2('readonly', !userCanManage);
                } else {
                    $groupProperties.find('.data-classification').hide();
                    $('#f-group-update-data-classification').select2('readonly', true);
                }

                if (group.data_classification === null)
                    $('#f-group-update-data-classification')
                        .val('unspecified').trigger('change');
                else
                    $('#f-group-update-data-classification')
                        .val(group.data_classification).trigger('change');

                $groupProperties.find('#f-group-update-submit')
                    .attr('hidden', !userCanManage);
            })();

            // }}}
            // Build the user list panel {{{

            that.updateGroupMemberCount(groupName);

            (function(){
                var users = that.groups[groupName].members;

                var $userList = $('#user-list');
                $userList.find('.list-group-item.user').remove();

                Object.keys(users).slice().sort(function(a, b) {
                    function cmp(a, b) {
                        // For lack of a built-in '<=>' compare operator...
                        return (  a < b ? -1
                                : a > b ?  1
                                : 0);
                    }

                    // Sort based on access level first (more rights => higher in the list).
                    return (cmp(that.accessLevels.indexOf(users[b].access),
                                that.accessLevels.indexOf(users[a].access))
                            // ... then sort alphabetically on username.
                            || cmp(a, b));

                }).forEach(function(userName, i){
                    // Loop through the sorted user list and generate the #userList element.
                    var user = users[userName];

                    var $user = $('<a class="list-group-item list-group-item-action user">');
                    $user.attr('id', 'user-' + i);
                    $user.addClass('user-access-' + user.access);
                    $user.attr('data-name', userName);
                    if (userName === that.userNameFull) {
                        $user.addClass('self');
                        if (!that.isRodsAdmin)
                            $user.addClass('disabled')
                                 .attr('title', 'You cannot change your own role or remove yourself from this group.');
                    }

                    var displayName = userName;
                    var nameAndZone = userName.split('#');
                    // Only display a user's zone if it differs
                    // from the client's zone.
                    if (nameAndZone[1] == that.zone)
                        displayName = nameAndZone[0];

                    $user.html('<i class="fa-solid '
                               + that.accessIcons[user.access]
                               + '" aria-hidden="true" title="'
                               + that.accessNames[user.access]
                               + '"></i> '
                               + Yoda.escapeEntities(displayName));

                    $userList.append($user);
                });

                // Move the user creation item to the bottom of the list.
                var $userList2 = $('#user-list-add-user');
                var $userCreateItem = $userList2.find('.item-user-create');
                $userList2.find('#f-user-create-group').val(groupName);
                $userList2.attr('hidden', !that.canManageGroup(groupName));

                var $userPanel = $('.card.users');
                $userPanel.find('#user-list').removeClass('hidden');
                $userPanel.find('.card-body:has(.placeholder-text)').addClass('hidden');

                // Fix bad bootstrap borders caused by hidden elements.
                $userPanel.find('.card-header').css({ borderBottom: 'none' });
                $userPanel.find('.card-footer').css( { borderTop:    ''     });

                $userPanel.find('.create-button').removeClass('disabled');
                $userPanel.find('.update-button, .delete-button').addClass('disabled');
            })();

            // }}}
        },

        /**
         * \brief Deselects the selected group, if any.
         */
        deselectGroup: function() {
            this.deselectUser();

            var $groupPanel = $('.card.groups');
            $groupPanel.find('.delete-button').addClass('disabled');

            var $groupList = $('#group-list');
            $groupList.find('.active').removeClass('active');

            var $groupProperties = $('#group-properties');
            $groupProperties.find('.placeholder-text').removeClass('hidden');
            $groupProperties.find('form').addClass('hidden');

            var $userPanel = $('.card.users');

            var $panelTitle = $userPanel.find('.card-title');
            $panelTitle.text($panelTitle.text().replace(/\s*\(\d+\)$/, ''));

            $userPanel.find('#user-list-search').val('');
            $userPanel.find('.card-body:has(.placeholder-text)').removeClass('hidden');
            $userPanel.find('#user-list').addClass('hidden');

            // Fix bad bootstrap borders caused by hidden elements.
            $userPanel.find('.card-header').css({ borderBottom: ''               });
            $userPanel.find('.card-footer').css({ borderTop:    '1px solid #ddd' });

            $('#group-properties-group-name').html('');

            Yoda.storage.session.remove('selected-group');
        },

        /**
         * \brief Select the given user in the user list.
         *
         * \param groupName
         */
        selectUser: function(userName) {
            var $userList = $('#user-list');

            var $user    = $userList.find('.user[data-name="' + Yoda.escapeQuotes(userName) + '"]');
            var $oldUser = $userList.find('.active');

            if ($user.is($oldUser))
                return;

            this.deselectUser();

            $userList.find('.active').removeClass('active');
            $user.addClass('active');

            if (this.canManageGroup($('#group-list .active.group').attr('data-name'))) {
                var $userPanel = $('.card.users');

                var $promoteButton = $userPanel.find('.promote-button');
                var $demoteButton  = $userPanel.find('.demote-button');

                var selectedGroupName = $($('#group-list .group.active')[0]).attr('data-name');
                var selectedGroup = this.groups[selectedGroupName];
                var selectedUser = selectedGroup.members[userName];

                var promoteTitle = 'Promote the selected member';
                var demoteTitle  = 'Demote the selected member';

                var prevAccess = this.prevAccessLevel(selectedUser.access, selectedGroupName);
                var nextAccess = this.nextAccessLevel(selectedUser.access, selectedGroupName);

                if (prevAccess) {
                    $demoteButton.find('i').addClass('fa-solid ' + this.accessIcons[prevAccess]);
                    $demoteButton.removeClass('disabled');
                    $demoteButton.attr('data-target-role', prevAccess);
                    demoteTitle += ' to ' + this.accessNames[prevAccess].toLowerCase();
                }
                if (nextAccess) {
                    $promoteButton.find('i').addClass('fa-solid ' + this.accessIcons[nextAccess]);
                    $promoteButton.removeClass('disabled');
                    $promoteButton.attr('data-target-role', nextAccess);
                    promoteTitle += ' to ' + this.accessNames[nextAccess].toLowerCase();
                }

                $promoteButton.attr('title', promoteTitle);
                $demoteButton .attr('title',  demoteTitle);
                $userPanel.find('.delete-button').removeClass('disabled');
            }
        },

        /**
         * \brief Deselects the selected user, if any.
         */
        deselectUser: function() {
            var $userPanel = $('.card.users');
            var $userList  = $('#user-list');
            $userList.find('.active').removeClass('active');
            $userPanel.find('.update-button, .delete-button').addClass('disabled');
            var $promoteButton = $userPanel.find('.promote-button');
            var $demoteButton  = $userPanel.find('.demote-button');
            $promoteButton.attr('title', 'Promote the selected member');
            $demoteButton .attr('title', 'Demote the selected member');
            $promoteButton.removeAttr('data-target-role');
            $demoteButton .removeAttr('data-target-role');
            $promoteButton.find('i').removeClass();
            $demoteButton .find('i').removeClass();
        },

        /**
         * \brief Turn certain inputs into select2 inputs with autocompletion.
         */
        selectifyInputs: function(sel) {
            var that = this;

            // Category fields {{{

            $(sel).filter('.selectify-category').each(function() {
                var $el = $(this);

                $el.attr(
                    'placeholder',
                    (that.isMemberOfGroup('priv-category-add') || that.isRodsAdmin)
                        ? 'Select one or enter a new name'
                        : 'Select a category'
                );

                $el.select2({
                    ajax: {
                        quietMillis: 200,
                        url:      '/group_manager/get_categories',
                        type:     'post',
                        dataType: 'json',
                        data: function (term, page) {
                            return { query: term };
                        },
                        results: function (data) {
                            var categories = data.categories
                            var results = [];
                            var query   = $el.data('select2').search.val();
                            var inputMatches = false;

                            // For legacy reasons we allow selecting existing categories with illegal names.
                            // New categories (where we show '(create)' in the dropdown) must adhere to the new rules:
                            // They must be valid as part of a group name -> only lowercase letters, numbers and hyphens.
                            //
                            // When we drop support for the old category name style this code can be updated to
                            // automatically lowercase user input (see the username input code for an example).

                            categories.forEach(function(category) {
                                if (query === category)
                                    inputMatches = true;

                                if (that.isManagerInCategory(category))
                                    results.push({
                                        id:   category,
                                        text: category,
                                    });
                                else if (inputMatches)
                                    // Only show a (disabled) category the user doesn't have access to
                                    // if they type its exact name.
                                    results.push({
                                        id:       category,
                                        text:     category,
                                        disabled: true,
                                    });
                            });

                            results.sort(function(a, b) {
                                return (a.id === b.id  ?  0 :
                                        a.id === query ? -1 :
                                        b.id === query ?  1 :
                                        a.id >=  b.id  ?  1 : -1);
                            });

                            if (
                                  !inputMatches
                                && query.length
                                && (that.isMemberOfGroup('priv-category-add') || that.isRodsAdmin)
                            ) {
                                results.push({
                                    id:     query,
                                    text:   query,
                                    exists: false
                                });
                            }

                            return { results: results };
                        },
                    },
                    formatResult: function(result, $container, query, escaper) {
                        return escaper(result.text)
                            + (
                                'exists' in result && !result.exists
                                ? ' <span class="grey">(create)</span>'
                                : ''
                            );
                    },
                    initSelection: function($el, callback) {
                        callback({ id: $el.val(), text: $el.val() });
                    },
                }).on('open', function() {
                    $(this).select2('val', '');
                }).on('change', function() {
                    $($(this).attr('data-subcategory')).select2('val', '');

                    // bring over the category value to the schema-id if exists.
                    if (that.schemaIDs.includes($(this).select2('val'))) {
                        $('#f-group-create-schema-id').select2('val', $(this).select2('val'));
                    }

                    if (this.id === 'f-group-create-category') {
                        if (that.canCreateDatamanagerGroup(this.value))
                            $('#f-group-create-prefix-datamanager').removeClass('hidden');
                        else
                            $('#f-group-create-prefix-datamanager').addClass('hidden');

                        if ($('#f-group-create-name').attr('data-prefix') === 'datamanager-') {
                            // Reset the group name + prefix by pretending that
                            // the user clicked on the default prefix.
                            $('#f-group-create-prefix-div a[data-value="' + that.GROUP_DEFAULT_PREFIX + '"]').click();
                            $('#f-group-create-name').val('');
                        }
                    }
                });
            });

            // }}}
            // Subcategory fields {{{

            $(sel).filter('.selectify-subcategory').each(function() {
                var $el = $(this);

                $el.select2({
                    ajax: {
                        quietMillis: 200,
                        url:      '/group_manager/get_subcategories',
                        type:     'post',
                        dataType: 'json',
                        data: function (term, page) {
                            return {
                                category: $($el.attr('data-category')).val(),
                                query: term
                            };
                        },
                        results: function (data) {
                            var subcategories = data.subcategories
                            var results = [];
                            var query   = $el.data('select2').search.val();
                            var inputMatches = false;

                            subcategories.forEach(function(subcategory) {
                                results.push({
                                    id:   subcategory,
                                    text: subcategory
                                });
                                if (query === subcategory)
                                    inputMatches = true;
                            });

                            results.sort(function(a, b) {
                                return (a.id === b.id  ?  0 :
                                        a.id === query ? -1 :
                                        b.id === query ?  1 :
                                        a.id >=  b.id  ?  1 : -1);
                            });

                            if (!inputMatches && query.length)
                                results.push({
                                    id:   query,
                                    text: query,
                                    exists: false
                                });

                            return { results: results };
                        },
                    },
                    formatResult: function(result, $container, query, escaper) {
                        return escaper(result.text)
                            + (
                                'exists' in result && !result.exists
                                ? ' <span class="grey">(create)</span>'
                                : ''
                            );
                    },
                    initSelection: function($el, callback) {
                        callback({ id: $el.val(), text: $el.val() });
                    },
                }).on('open', function() {
                    $(this).select2('val', '');
                });
            });


            // }}}

            // Schema-id {{{
            $(sel).filter('.selectify-schema-id').each(function() {
                var $el = $(this);

                $el.select2({
                    ajax: {
                        quietMillis: 200,
                        url:      '/group_manager/get_schemas',
                        type:     'post',
                        dataType: 'json',
                        data: function (term, page) {
                            return { query: term };
                        },

                        results: function (data) {
                            var schemas = data.schemas
                            var results = [];
                            var query   = $el.data('select2').search.val();
                            var inputMatches = false;

                            schemas.forEach(function(schema) {
                                if (schema.startsWith(query)) {
                                    results.push({
                                        id:   schema,
                                        text: schema,
                                    });
                                 }
                            });

                            results.sort(function(a, b) {
                                return (a.id === b.id  ?  0 :
                                        a.id === query ? -1 :
                                        b.id === query ?  1 :
                                        a.id >=  b.id  ?  1 : -1);
                            });

                            return { results: results };
                        },
                    },
                    formatResult: function(result, $container, query, escaper) {
                        return escaper(result.text)
                            + (
                                'exists' in result && !result.exists
                                ? ' <span class="grey">(create)</span>'
                                : ''
                            );
                    },
                    initSelection: function($el, callback) {
                        callback({ id: $el.val(), text: $el.val() });
                    },
                }).on('open', function() {
                    $(this).select2('val', '');
                }).on('change', function() {
                });
            });


            // }}}

            // Username fields {{{
            $(sel).filter('.selectify-user-name').each(function() {
                var $el = $(this);

                $el.select2({
                    allowClear:  true,
                    openOnEnter: false,
                    minimumInputLength: 3,
                    ajax: {
                        quietMillis: 400,
                        url:      '/group_manager/get_users',
                        type:     'post',
                        dataType: 'json',
                        data: function (term, page) {
                            return {
                                query: term.toLowerCase()
                            };
                        },
                        results: function (data) {
                            var users = data.users
                            var query   = $el.data('select2').search.val().toLowerCase();
                            var results = [];
                            var inputMatches = false;

                            users.forEach(function(userName) {
                                // Exclude users already in the group.
                                if (!(userName in that.groups[$($el.attr('data-group')).val()].members)) {
                                    var nameAndZone = userName.split('#');
                                    results.push({
                                        id:   userName,
                                        text: nameAndZone[1] === that.zone ? nameAndZone[0] : userName
                                    });
                                }
                                if (query === userName || query + '#' + that.zone === userName)
                                    inputMatches = true;
                            });

                            if (!inputMatches && query.length)
                                results.push({
                                    id:   query,
                                    text: query,
                                    exists: false
                                });

                            return { results: results };
                        },
                    },
                    formatResult: function(result, $container, query, escaper) {
                        return escaper(result.text)
                            + (
                                'exists' in result && !result.exists
                                ? ' <span class="grey">(create)</span>'
                                : ''
                            );
                    },
                    initSelection: function($el, callback) {
                        callback({ id: $el.val(), text: $el.val() });
                    },
                }).on('open', function() {
                    $(this).select2('val', '');
                });
            });

            // }}}
        },

        /**
         * \brief Group create / update form submission handler.
         *
         * `this` is assumed to be the groupManager object, not the form element
         * that was submitted.
         *
         * \param button the button that determines updating or creation of group data
         */
        onSubmitGroupCreateOrUpdate: function(button) {

            var action =
                $(button).attr('id') === 'f-group-create-submit'
                ? 'create' : 'update';

            $(button).addClass('disabled').val(
                    action === 'create'
                    ? 'Adding group...'
                    : 'Updating...'
                );

            function resetSubmitButton() {
                $(button).removeClass('disabled')
                    .val(
                        action === 'create'
                        ? 'Add group'
                        : 'Update'
                    );
            }

            // all now bases upon update-fields. Create dialog is discarded
            var newProperties = {
                name:                $('#f-group-' + action + '-name'     ).attr('data-prefix')
                                   + $('#f-group-' + action + '-name'     ).val(),
                description:         $('#f-group-' + action + '-description').val(),
                schema_id:           $('#f-group-' + action + '-schema-id').val(),
                data_classification: $('#f-group-' + action + '-data-classification').val(),
                category:            $('#f-group-' + action + '-category'   ).val(),
                subcategory:         $('#f-group-' + action + '-subcategory').val(),
            };

            if (newProperties.name.startsWith("datamanager-") && !this.canCreateDatamanagerGroup(newProperties.category)) {
                alert("Datamanager group names may only contain lowercase letters (a-z) and hyphens (-).");
                resetSubmitButton();
                return;
            }

            if (!newProperties.name.startsWith("datamanager-") && !newProperties.name.match(/^(intake|research|deposit)-([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$/)) {
                alert("Group names must start with one of 'intake-' or 'research-' or 'deposit-' and may only contain lowercase letters (a-z) and hyphens (-).");
                resetSubmitButton();
                return;
            }

            if (newProperties.category === '' || newProperties.subcategory === '') {
                alert('Please select a category and subcategory.');
                resetSubmitButton();
                return;
            } else if (
                // Validate input, in case HTML5 validation did not work.
                // Also needed for the select2 inputs.
                [newProperties.category, newProperties.subcategory, newProperties.description]
                    .some(function(item) {
                        return !item.match(/^[a-zA-Z0-9,.()_ -]*$/);
                    })
            ) {
                alert('The (sub)category name and group description fields may only contain letters a-z, numbers, spaces, comma\'s, periods, parentheses, underscores (_) and hyphens (-).');
                resetSubmitButton();
                return;
            }

            // Check if schema id is valid.
            if (!this.schemaIDs.includes(newProperties.schema_id)) {
                alert('Please select a valid metadata schema as it is a required field');
                resetSubmitButton();
                return;
            }

            var postData = {
                group_name:                newProperties.name,
                group_description:         newProperties.description,
                group_schema_id:           newProperties.schema_id,
                group_data_classification: newProperties.data_classification,
                group_category:            newProperties.category,
                group_subcategory:         newProperties.subcategory,
            };

            // Avoid trying to set a schema id for groups that
            // can't have one.
            if (!this.prefixHasSchemaId(this.getPrefix(newProperties.name)))
                delete postData.group_schema_id;

            if (action === 'update') {
                var selectedGroup = this.groups[$($('#group-list .group.active')[0]).attr('data-name')];
                ['description',
                 'data_classification',
                 'category',
                 'subcategory'].forEach(function(item) {
                    // Filter out fields that have not changed.
                    if (selectedGroup[item] === newProperties[item])
                        delete postData['group_' + item];
                });
            }

            var that = this;

            // Avoid trying to set/update a data classification for groups that
            // can't have one.
            if (!this.prefixHasDataClassification(this.getPrefix(newProperties.name)))
                delete postData.group_data_classification;

            $.ajax({
                url:      $(button).attr('action'),
                type:     'post',
                dataType: 'json',
                data:     postData
            }).done(function(result) {
                if ('status' in result) {
                    console.log('Group '+action+' completed with status ' + result.status);
                }
                if ('status' in result && result.status === 0) {
                    // OK! Make sure the newly added group is selected after reloading the page.
                    Yoda.storage.session.set('selected-group', postData.group_name);

                    // And give the user some feedback.
                    Yoda.storage.session.set('messages',
                        Yoda.storage.session.get('messages', []).concat({
                            type:    'success',
                            message: action === 'create'
                                     ? 'Created group ' + postData.group_name + '.'
                                     : 'Updated '       + postData.group_name + ' group properties.'
                        })
                    );

                    $(window).on('beforeunload', function() {
                        $(window).scrollTop(0);
                    });
                    window.location.reload(true);
                } else {
                    // Something went wrong.
                    resetSubmitButton();

                    if ('message' in result) {
                        alert(result.message);
                    } else {
                        alert(
                              "Error: Could not "+action+" group due to an internal error.\n"
                            + "Please contact a Yoda administrator"
                        );
                    }
                    return;
                }
            }).fail(function(result) {
                that.ifRequestNotAborted(result, function() {
                    alert("Error: Could not "+action+" group due to an internal error.\nPlease contact a Yoda administrator");
                    resetSubmitButton();
                });
            });
        },

        /**
         * \brief Handle a group delete button click event.
         */
        onClickGroupDelete: function(el) {
            var groupName = $('#group-list .group.active').attr('data-name');

            $('#group-list .group.active')
                .addClass('delete-pending disabled')
                .attr('title', 'Removal pending');
            this.deselectGroup();

            var that = this;

            $.ajax({
                url:      $(el).attr('data-action'),
                type:     'post',
                dataType: 'json',
                data: {
                    group_name: groupName,
                },
            }).done(function(result) {
                if ('status' in result)
                    console.log('Group remove completed with status ' + result.status);
                if ('status' in result && result.status === 0) {
                    // Give the user some feedback.
                    Yoda.storage.session.set('messages',
                        Yoda.storage.session.get('messages', []).concat({
                            type:    'success',
                            message: 'Removed group ' + groupName + '.'
                        })
                    );

                    $(window).on('beforeunload', function() {
                        $(window).scrollTop(0);
                    });
                    window.location.reload(true);
                } else {
                    // Something went wrong.

                    // Re-enable group list entry.
                    $('#group-list .group.delete-pending[data-name="' + Yoda.escapeQuotes(groupName) + '"]').removeClass('delete-pending disabled').attr('title', '');

                    if ('message' in result)
                        alert(result.message);
                    else
                        alert(
                              "Error: Could not remove the selected group due to an internal error.\n"
                            + "Please contact a Yoda administrator"
                        );
                }
            }).fail(function(result) {
                that.ifRequestNotAborted(result, function() {
                    alert("Error: Could not remove the selected group due to an internal error.\nPlease contact a Yoda administrator");
                });
            });
        },

        /**
         * \brief User add form submission handler.
         *
         * Adds a user to the selected group.
         *
         * `this` is assumed to be the groupManager object, not the form element
         * that was submitted.
         *
         * \param el the form element
         * \param e  a submit event
         */
        onSubmitUserCreate: function(el, e) {
            e.preventDefault();

            if ($(el).find('input[type="submit"]').hasClass('disabled'))
                return;

            var groupName = $(el).find('#f-user-create-group').val();
            var  userName = $(el).find('#f-user-create-name' ).val().trim();

            if (!userName.match(/^([a-z.]+|[a-z0-9_.-]+@[a-z0-9_.-]+)(#[a-zA-Z0-9_-]+)?$/)) {
                alert('Please enter either an e-mail address or a name consisting only of lowercase chars and dots.');
                return;
            }

            $(el).find('input[type="submit"]').addClass('disabled').val('Adding...');

            var that = this;

            $.ajax({
                url:      $(el).attr('action'),
                type:     'post',
                dataType: 'json',
                data: {
                    group_name: groupName,
                    user_name: userName,
                },
            }).done(function(result) {
                if ('status' in result)
                    console.log('User add completed with status ' + result.status);
                if ('status' in result && result.status === 0) {
                    that.groups[groupName].members[userName] = {
                        // XXX
                        access: 'normal'
                    };

                    $(el).find('#f-user-create-name').select2('val', '');

                    that.deselectGroup();
                    that.selectGroup(groupName);
                    that.selectUser(userName);

                    // Give a visual hint that the user was added.
                    $('#user-list .user[data-name="' + Yoda.escapeQuotes(userName) + '"]')[0].scrollIntoView({
                        block: "center",
                        behavior: "smooth"
                    });
                    $('#user-list .user[data-name="' + Yoda.escapeQuotes(userName) + '"]').addClass('blink-once');

                    // open the select-user select2 for ease of use
                    $('.selectify-user-name').select2('open');
                } else {
                    // Something went wrong. :(
                    if ('message' in result)
                        alert(result.message);
                    else
                        alert(
                              "Error: Could not add a member due to an internal error.\n"
                            + "Please contact a Yoda administrator"
                        );
                }
                $(el).find('input[type="submit"]').removeClass('disabled').val('Add');

            }).fail(function(result) {
                that.ifRequestNotAborted(result, function() {
                    alert("Error: Could not add a member due to an internal error.\nPlease contact a Yoda administrator");
                    $(el).find('input[type="submit"]').removeClass('disabled').val('Add');
                });
            });
        },

        /**
         * \brief Remove the confirmation step for removing users from groups.
         */
        removeUserDeleteConfirmationModal: function() {
            var that = this;
            $('.users.card .delete-button').off('click').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                that.onClickUserDelete(this);
            });
        },

        /**
         * \brief Handle a change role button click event.
         *
         * `this` is assumed to be the groupManager object, not the form element
         * that was submitted.
         *
         * \param el
         * \param e
         */
        onClickUserUpdate: function(el, e) {
            var that = this;

            var groupName = $('#group-list .group.active').attr('data-name');
            var  userName = $('#user-list   .user.active').attr('data-name');

            $('#user-list .user.active')
                .addClass('update-pending disabled')
                .attr('title', 'Update pending');

            // Get the new role name from the button element before we deselect the user.
            var newRole = $(el).attr('data-target-role');

            this.deselectUser();

            $.ajax({
                url:      $(el).attr('data-action'),
                type:     'post',
                dataType: 'json',
                data: {
                    group_name: groupName,
                     user_name: userName,
                    new_role:   newRole
                },
            }).done(function(result) {
                if ('status' in result)
                    console.log('User update completed with status ' + result.status);
                if ('status' in result && result.status === 0) {
                    // Update user role.
                    that.groups[groupName].members[userName].access = newRole

                    // Force-regenerate the user list.
                    that.deselectGroup();
                    that.selectGroup(groupName);

                    // Give a visual hint that the user was updated.
                    $('#user-list .user[data-name="' + Yoda.escapeQuotes(userName) + '"]').addClass('blink-once');
                } else {
                    // Something went wrong. :(

                    $('#user-list .user.update-pending[data-name="' + Yoda.escapeQuotes(userName) + '"]')
                        .removeClass('update-pending disabled')
                        .attr('title', '');

                    if ('message' in result)
                        alert(result.message);
                    else
                        alert(
                              "Error: Could not change the role for the selected member due to an internal error.\n"
                            + "Please contact a Yoda administrator"
                        );
                }
            }).fail(function(result) {
                that.ifRequestNotAborted(result, function() {
                    alert("Error: Could not change the role for the selected member due to an internal error.\nPlease contact a Yoda administrator");
                });
            });
        },

        /**
         * \brief Handle a user delete button click event.
         *
         * `this` is assumed to be the groupManager object, not the form element
         * that was submitted.
         */
        onClickUserDelete: function(el) {
            if ($('#f-user-delete-no-confirm').prop('checked')) {
                $('#f-user-delete-no-confirm').prop('checked', false);
                Yoda.storage.session.set('confirm-user-delete', false);
                this.removeUserDeleteConfirmationModal();
            }

            var groupName = $('#group-list .group.active').attr('data-name');
            var  userName = $('#user-list   .user.active').attr('data-name');

            $('#user-list .user.active')
                .addClass('delete-pending disabled')
                .attr('title', 'Removal pending');
            this.deselectUser();

            var that = this;

            $.ajax({
                url:      $(el).attr('data-action'),
                type:     'post',
                dataType: 'json',
                data: {
                    group_name: groupName,
                     user_name: userName,
                },
            }).done(function(result) {
                if ('status' in result)
                    console.log('User remove completed with status ' + result.status);
                if ('status' in result && result.status === 0) {
                    delete that.groups[groupName].members[userName];

                    // Force-regenerate the user list.
                    that.deselectGroup();
                    that.selectGroup(groupName);
                } else {
                    // Something went wrong. :(

                    // Re-enable user list entry.
                    $('#user-list .user.delete-pending[data-name="' + Yoda.escapeQuotes(userName) + '"]').removeClass('delete-pending disabled').attr('title', '');

                    if ('message' in result)
                        alert(result.message);
                    else
                        alert(
                              "Error: Could not remove the selected member from the group due to an internal error.\n"
                            + "Please contact a Yoda administrator"
                        );
                }
            }).fail(function(result) {
                that.ifRequestNotAborted(result, function() {
                    alert("Error: Could not remove the selected member from the group due to an internal error.\nPlease contact a Yoda administrator");
                });
            });
        },

        /**
         * \brief Initialize the group manager module.
         *
         * The structure of the groupHierarchy parameter is as follows:
         *
         *     {
         *       'CATEGORY_NAME': {
         *         'SUBCATEGORY_NAME': {
         *           'GROUP_NAME': {
         *             'description': 'GROUP_DESCRIPTION',
         *             'data-classification': 'GROUP_DATA_CLASSIFICATION',
         *             'members': {
         *               'USER_NAME': {
         *                 'access': (reader | normal | manager)
         *               }, ...
         *             }
         *           }, ...
         *         }, ...
         *       }, ...
         *     }
         *
         * \param groupHierarchy An object representing the category / group hierarchy visible to the user.
         *
         * \todo Generate the group list in JS just like the user list.
         */
        load: function(groupHierarchy, schemaIDs, userType, userZone) {
            this.groupHierarchy = groupHierarchy;
            this.schemaIDs      = schemaIDs
            this.isRodsAdmin    = userType == 'rodsadmin';
            this.zone           = userZone;
            this.userNameFull   = Yoda.user.username + '#' + userZone;
            this.groups         = (function(hier) {
                // Create a flat group map based on the hierarchy object.
                var groups = { };
                for (var categoryName in hier) {
                    for (var subcategoryName in hier[categoryName]) {
                        for (var groupName in hier[categoryName][subcategoryName]) {
                            groups[groupName] = {
                                category:    categoryName,
                                subcategory: subcategoryName,
                                name:        groupName,
                                description: hier[categoryName][subcategoryName][groupName].description,
                                schema_id:   hier[categoryName][subcategoryName][groupName].schema_id,
                                data_classification: hier[categoryName][subcategoryName][groupName].data_classification,
                                members:     hier[categoryName][subcategoryName][groupName].members
                            };

                        }
                    }
                }
                return groups;
            })(this.groupHierarchy);
            var that = this;
            var $groupList = $('#group-list');

            // Attach event handlers {{{
            // Generic {{{

            $(document).ajaxSend(function(e, request, settings) {
                // Append a CSRF token to all AJAX POST requests.
                if (settings.type === 'POST' && settings.data.length)
                    settings.data
                        += '&' + encodeURIComponent(Yoda.csrf.tokenName)
                         + '=' + encodeURIComponent(Yoda.csrf.tokenValue);
            });
            // }}}

            // Set inial state of group create button {{{
            if (this.isMemberOfGroup('priv-group-add') || this.isRodsAdmin) {
                $('.create-button-new').removeClass('hidden');
            }
            else {
                $('.create-button-new').addClass('hidden');
            }
            // }}}

            // Group list {{{

            $groupList.on('show.bs.collapse', function(e) {
                $(e.target).parent('.list-group-item').find('.triangle').first()
                    .removeClass('fa-caret-right')
                       .addClass('fa-caret-down');
            });

            $groupList.on('shown.bs.collapse', function(e) {
                // Once a category is fully opened, open its subcategory (if there is only one).
                var subs = $(e.target).children(".subcategory");
                subs.children('.subcategory-ul').collapse('hide');
                if (subs.length == 1) {
                    // Only one subcategory, expand it automatically.
                    subs.first().children('a.name').removeClass('collapsed');
                    subs.first().children('.subcategory-ul').removeClass('hidden');
                    subs.first().children('.subcategory-ul').collapse('show');
                }
            });

            $groupList.on('hide.bs.collapse', function(e) {
                $(e.target).parent('.list-group-item').find('.triangle').first()
                    .removeClass('fa-caret-down')
                       .addClass('fa-caret-right');
            });

            $groupList.on('click', 'a.group', function() {
                if ($(this).is($groupList.find('.active')))
                    that.deselectGroup();
                else
                    that.selectGroup($(this).attr('data-name'));
            });

            // Group list search.
            $('#group-list-search').on('keyup', function() {
                $groupList  = $('#group-list');

                var $categories   = $groupList.find('.category');
                var $groups       = $groupList.find('.group');

                if ($(this).val().length) {
                    // Filter all group not matching search value.
                    var quotedVal = Yoda.escapeQuotes($(this).val());
                    $groups.filter('.filtered[data-name*="' + quotedVal + '"]').removeClass('filtered');
                    $groups.filter(':not(.filtered):not([data-name*="' + quotedVal + '"])').addClass('filtered');

                    // Loop through categories and filter out empty categories.
                    $categories.each(function() {
                        var $subcategories = $(this).find('.subcategory-ul');
                        var emptyCategory = true;
                        // Loop through subcategories and filter out empty subcategories.
                        $subcategories.each(function() {
                            if($(this).children(':not(.filtered)').length == 0) {
                                $(this).parent().addClass('filtered');
                            } else {
                                emptyCategory = false;
                            }
                        });

                        if (emptyCategory) {
                            $(this).addClass('filtered');
                        }
                    });
                } else {
                    // Reset all filters.
                    var $filtered = $groupList.find('.filtered');
                    $filtered.each(function() {
                        $(this).removeClass('filtered');
                    });
                }
            });

            // Group creation {{{

            $('#f-group-create-prefix-div a').on('click', function(e) {
                // Select new group prefix.
                var newPrefix = $(this).attr('data-value');
                var oldPrefix = $('#f-group-create-name').attr('data-prefix');

                $('#f-group-create-prefix-div button .text').html(newPrefix + '&nbsp;');
                $('#f-group-create-name').attr('data-prefix', newPrefix);

                if (newPrefix === 'datamanager-') {
                    // Autofill the group name - the user cannot customize the
                    // name of a datamanager group.
                    $('#f-group-create-name').val($('#f-group-create-category').val());
                    $('#f-group-create-name').prop('readonly', true);
                } else {
                    $('#f-group-create-name').prop('readonly', false);
                }

                var hadDataClass = that.prefixHasDataClassification(oldPrefix);
                var haveDataClass = that.prefixHasDataClassification(newPrefix);

                if (hadDataClass != haveDataClass) {
                    if (haveDataClass) {
                        $('.data-classification').show();
                        $('#f-group-create-data-classification').val('unspecified').trigger('change');

                    } else {
                        $('.data-classification').hide();
                    }
                }

                var hadSchemaId = that.prefixHasSchemaId(oldPrefix);
                var haveSchemaId = that.prefixHasSchemaId(newPrefix);

                if (hadSchemaId != haveSchemaId) {
                    if (haveSchemaId) {
                        $('.schema-id').show();
                    } else {
                        $('.schema-id').hide();
                    }
                }

                e.preventDefault();
            });


            // Only rodsadmin can select the 'grp-' prefix.
            if (!this.isRodsAdmin)
                $('#f-group-create-prefix-grp').addClass('hidden');

            // Group removal.
            $('#modal-group-delete .confirm').on('click', function(e) {
                that.onClickGroupDelete($('.card.properties-update .delete-button')[0]);
                $('#modal-group-delete').modal('hide');
            });

            $('#modal-group-delete').on('show.bs.modal', function() {
                var groupName = $('#group-list .group.active').attr('data-name');
                $(this).find('.group').text(groupName);
            });

            // }}}
            // }}}
            // User list {{{

            var $userList = $('#user-list');
            $userList.on('click', 'a.user:not(.disabled)', function() {
                if ($(this).is($userList.find('.active')))
                    that.deselectUser();
                else
                    that.selectUser($(this).attr('data-name'));
            });

            $userList.on('click', '.list-group-item:has(.user-create-text:not(.hidden))', function() {
                // Show the user add form.
                that.deselectUser();
                $(this).find('.user-create-text').attr('hidden', '');
                $(this).find('form').removeClass('hidden');
                $(this).find('form').find('#f-user-create-name').select2('open');
            });

            $('#f-user-create-name').on('select2-close', function() {
                // Remove the new user name input on unfocus if nothing was entered.
                if ($(this).val().length === 0) {
                    $(this).parents('.list-group-item').find('.user-create-text').removeAttr('hidden');
                }
            });

            // Adding users to groups.
            $('#f-user-create').on('submit', function(e) {
                that.onSubmitUserCreate(this, e);
            });

            // Changing user roles.
            $('.users.card .update-button').on('click', function(e) {
                that.onClickUserUpdate(this, e);
            });

            // Remove users from groups.
            $('#modal-user-delete .confirm').on('click', function(e) {
                that.onClickUserDelete($('.users.card .delete-button')[0]);
                $('#modal-user-delete').modal('hide');
            });

            $('#modal-user-delete').on('show.bs.modal', function() {
                var groupName = $('#group-list .group.active').attr('data-name');
                var  userName = $('#user-list  .user.active').attr('data-name');
                $(this).find('.group').text(groupName);
                $(this).find('.user').text(userName.split('#')[0]);
            });

            if (!Yoda.storage.session.get('confirm-user-delete', true))
                this.removeUserDeleteConfirmationModal();

            // User list search.
            $('#user-list-search').on('keyup', function() {
                var $users  = $('.card.users .user');

                if ($(this).val().length) {
                    var quotedVal = Yoda.escapeQuotes($(this).val());
                    $users.filter('.filtered[data-name*="' + quotedVal + '"]').removeClass('filtered');
                    $users.filter(':not(.filtered):not([data-name*="' + quotedVal + '"])').addClass('filtered');
                } else {
                    $users.removeClass('filtered');
                }
            });

            // }}}
            // }}}

            this.selectifyInputs('.selectify-category, .selectify-subcategory, .selectify-schema-id, .selectify-user-name');
            $('.selectify-data-classification').select2();

            if (this.isMemberOfGroup('priv-group-add') || this.isRodsAdmin) {
                var $groupPanel = $('.card.groups');
                $groupPanel.find('.create-button').removeClass('disabled');
            }

            if (this.isMemberOfGroup('priv-group-add') || this.isRodsAdmin) {
                // show import button only for rodsadmin and members of priv-group-add
                $('.import-groups-csv').removeClass('hidden');
            }

            // Indicate which groups are managed by this user.
            for (var groupName in this.groups) {
                if (this.isManagerOfGroup(groupName)) {
                    $('#group-list .group[data-name="' + Yoda.escapeQuotes(groupName) + '"]').append(
                        '<i class="float-end fa-regular fa-user-circle mt-1" title="You manage this group"></i>'
                    );
                } else if (!this.isMemberOfGroup(groupName) && this.isRodsAdmin) {
                    $('#group-list .group[data-name="' + Yoda.escapeQuotes(groupName) + '"]').append(
                        '<i class="float-end fa-solid fa-wrench mt-1" title="You are not a member of this group, but you can manage it as an iRODS administrator."></i>'
                    );
                } else if (this.groups[groupName].members[this.userNameFull].access == 'reader') {
                    $('#group-list .group[data-name="' + Yoda.escapeQuotes(groupName) + '"]').append(
                        '<i class="float-end fa-solid fa-eye mt-1" title="You have read access to this group"></i>'
                    );
                }
            }

            var selectedGroup = Yoda.storage.session.get('selected-group');
            if (selectedGroup !== null && selectedGroup in this.groups) {
                // Automatically select the last selected group within this session (bound to this tab).
                this.selectGroup(selectedGroup);
            }

            if (Object.keys(this.groups).length < this.CATEGORY_FOLD_THRESHOLD) {
                // Unfold all categories containing non-priv groups if the user has access to less than
                // CATEGORY_FOLD_THRESHOLD groups.
                for (groupName in this.groups)
                    if (!groupName.match(/^priv-/))
                        this.unfoldToGroup(groupName);
            } else {
                // When the user can only access a single category, unfold it automatically.
                var $categoryEls = $('#group-list .category');
                if ($categoryEls.length === 1)
                    this.unfoldToGroup($categoryEls.find('.group').attr('data-name'));
            }

            $(window).on('beforeunload', function() {
                that.unloading = true;
            });
        },

    };
});
