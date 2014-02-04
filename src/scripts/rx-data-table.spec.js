/* jshint node: true */
/* jshint multistr: true */
describe('Data Table Directive', function () {
    var el, scope, compile, elScope, document, httpBackend, timeout, filter,
        validTemplate;

    beforeEach(function () {
        module('rxDataTable');

        // We need to load all of the templates that are going to be used
        module('src/templates/rx-data-table.html');
        module('src/templates/rx-data-table-paginate.html');
        module('src/templates/rx-data-table-itemsPerPage.html');

        // Inject in angular constructs
        inject(function($rootScope, $compile, $document, $timeout,
                $templateCache, $httpBackend, $filter, PageTracking) {
            scope = $rootScope.$new();
            compile = $compile;
            document = $document;
            httpBackend = $httpBackend;
            timeout = $timeout;
            filter = $filter;


            validTemplate = '<rx-data-table row-key="ref_no" visibilty="true"\
                column-configuration="dtConfig" list-of-data="dtData"\
                column-display="dtColumnDisplay" column-presets="dtColumnPresets"\
                predicate="predicate"\
                row-style="{class: \'item-color-mapping\', field: \'severity\',\
                    bool: false}"\
                column-multi-sort="true" column-reordering="true"\
                pager="pager"></rx-data-table>';

            scope.predicate = ['-severity'];

            scope.pager = PageTracking.createInstance();

            scope.dtConfig = [
                {
                    'title': 'ID',
                    'dataField': 'ref_no',
                    'sortField': 'severity',
                    'linkField': 'item_link',
                    'hideable': false,
                    'cols': '2',
                    'class': 'item-color-mapping',
                    'help': {
                        'body': 'This field is sorted by severity, not the ref_no'
                    },
                    'ng-class': function (row) {
                        return (row.severity < 4) ? '_' + row.severity : '_4';
                    }
                },
                {
                    'title': 'Subject',
                    'dataField': 'subject',
                    'sortField': 'subject',
                    'cols': '7',
                    'editable': {
                        'clause': function () {
                            return true;
                        },
                        'endpoint': {
                            'url': '/api/item/{system}/{ref_no}',
                            'method': 'put'
                        }
                    }
                },
                {
                    'title': 'Status',
                    'cols': '2',
                    'dataField': 'status',
                    'class': 'item-status',
                    'editable': {
                        'clause': function (row) {
                            return (row.system == 'Manual');
                        },
                        'options': [
                            { value: 'In Progress', text: 'In Progress'},
                            { value: 'Pending Vendor', text: 'Pending Vendor'},
                            { value: 'Pending Customer', text: 'Pending Customer'},
                            { value: 'Pending Maintenance', text: 'Pending Maintenance'},
                            { value: 'Solved', text: 'Solved'}
                        ],
                        'preUpdate': function (column, row, newData) {
                            scope.$emit('pre-update-method', column, row, newData);
                            return true;
                        },
                        'postUpdateSuccess': function (column, row, newData) {
                            scope.$emit('post-update-success-method', column, row, newData);
                        },
                        'postUpdateError': function (column, row, newData) {
                            scope.$emit('post-update-error-method', column, row, newData);
                        },
                        'endpoint': {
                            'url': '/api/item/{system}/{ref_no}',
                            'method': 'put'
                        }
                    },
                    'icon': [
                        {
                            'field': 'state',
                            'class': 'item-state-img item-state-img-new',
                            'fieldValue': 'New'
                        },
                        {
                            'field': 'state',
                            'class': 'item-state-img item-state-img-feedback-received',
                            'fieldValue': 'Feedback Received'
                        },
                        {
                            'field': 'state',
                            'class': 'item-state-img item-state-img-active',
                            'fieldValue': 'Active'
                        },
                        {
                            'field': 'state',
                            'class': 'item-state-img item-state-img-solved',
                            'fieldValue': 'Solved'
                        },
                        {
                            'field': 'state',
                            'class': 'item-state-img item-state-img-scheduled',
                            'fieldValue': 'Scheduled'
                        },
                        {
                            'field': 'state',
                            'class': 'item-state-img item-state-img-pending',
                            'fieldValue': 'Pending'
                        }
                    ]
                },
                {
                    'title': 'Assigned',
                    'cols': '2',
                    'dataField': 'assigned',
                    'ng-class': {
                        'assigned': 'row.assigned',
                        'unassigned': '!row.assigned'
                    },
                    'editable': {
                        'clause': function (row) {
                            return (row.system === 'Manual');
                        },
                        'data': function () {
                            return [
                                    'Chris Cantu',
                                    'Roger Enriquez',
                                    'Andrew Yurisich',
                                    'Stephen Golub'
                                ];
                        },
                        'dataField': 'group',
                        'nullable': true,
                        'endpoint': {
                            'url': '/api/item/{system}/{ref_no}',
                            'method': 'put'
                        },
                    },
                },
                {
                    'title': 'Assigned',
                    'cols': '3',
                    'dataField': 'assigned'
                },
                {
                    'title': 'Multi-Line Subject',
                    'cols': '4',
                    'dataField': ['ref_no', 'subject'],
                    'sortField': 'subject',
                    'ng-class': function () {
                        // This is here to test a bad ng-class for failure
                    }
                }
            ];

            scope.dtColumnPresets = [
                {
                    'title': 'Default View',
                    'config': [0,1,2,3,5]
                },
                {
                    'title': 'Non Editable Assignee',
                    'config': [0,1,2,4]
                }
            ];

            scope.dtColumnDisplay = {
                'index': 0,
                'config': [0,1,2,3,5]
            };


            scope.dtData = [
                {
                    'ref_no': '123456',
                    'severity': 1,
                    'item_link': 'http://www.google.com',
                    'subject': 'Test Item 1',
                    'assigned': 'Chris Cantu',
                    'status': 'Feedback Received',
                    'state': 'Feedback Received',
                    'system': 'Bob'
                },
                {
                    'ref_no': '654321',
                    'severity': 2,
                    'item_link': 'http://www.google.com',
                    'subject': 'Test Item 2',
                    'assigned': 'Roger Enriquez',
                    'status': 'New',
                    'state': 'New',
                    'system': 'George'
                },
                {
                    'ref_no': '789100',
                    'severity': 3,
                    'item_link': 'http://www.rackspace.com',
                    'subject': 'Test Item 3',
                    'assigned': 'Andrew Yurisich',
                    'status': 'Feedback Pending',
                    'state': 'Pending',
                    'system': 'Bob'
                },
                {
                    'ref_no': '140102-0000012',
                    'severity': 3,
                    'item_link': 'http://www.rackspace.com',
                    'subject': 'Test Item 4',
                    'assigned': 'Andrew Yurisich',
                    'status': 'Pending Customer',
                    'state': 'Pending',
                    'system': 'Manual'
                },
                {
                    'ref_no': '140102',
                    'severity': 4,
                    'item_link': 'http://www.rackspace.com',
                    'subject': 'Test Item 5',
                    'assigned': '',
                    'status': 'Pending Customer',
                    'state': 'Pending',
                    'system': 'Manual'
                }

            ];

            // Now we need to grab the individual templates and put them in the
            // cache. This has to be done instead of the whenGET calls due to
            // the URL and Filepaths not being the same.
            var route = '/api/item/Manual/140102-0000012';
            var unassigned = JSON.stringify(
                {
                    'assigned': null,
                    'item_link': 'http://www.rackspace.com',
                    'ref_no': '140102-0000012',
                    'severity': 3,
                    'state': 'Pending',
                    'status': 'Pending Customer',
                    'subject': 'Test Item 4',
                    'system': 'Manual'
                }
            );
            var pending = JSON.stringify(
                {
                    'assigned': 'Andrew Yurisich',
                    'item_link': 'http://www.rackspace.com',
                    'ref_no': '140102-0000012',
                    'severity': 3,
                    'state': 'Pending',
                    'status': 'Pending Maintenance',
                    'subject': 'Test Item 4',
                    'system': 'Manual'
                }
            );
            httpBackend.when('PUT', route, '{"assigned":null}').respond(unassigned);
            httpBackend.when('PUT', route, '{"status":"Pending Maintenance"}').respond(pending);
            httpBackend.when('PUT', route, '{"status":"Pending"}').respond(400, 'Failure');
            httpBackend.when('PUT', route, '{"status":"Partying"}').respond(400,
                    '{"error": "You can not party here", "errorCode": 400}');
        });

        el = helpers.createDirective(validTemplate, compile, scope);

        elScope = el.isolateScope();

    });

    afterEach(function () {
        // zero out element
        el = null;
    });

    it('should build Table Headings from Configuration Data', function () {
        expect(el.find('.data-header .data-header-cell').length).to.equal(5);
    });

    it('should build Table Data dataRows from Configuration Data', function () {
        expect(el.find('.data-row').length).to.equal(5);
    });

    it('should build the table with pagination configuration passed in', function () {
        expect(elScope.pager.showAll).to.equal(false);
        expect(elScope.pager.itemsPerPage).to.equal(10);
    });

    it('should apply configured row class to every row', function () {
        elScope.predicate = ['severity'];
        scope.$digest();
        var count = 0;
        var expectedValues = ['_1', '_2', '_3', '_3', '_4'];

        el.find('.data-row').each(function () {
            expect($(this).hasClass('item-color-mapping')).to.equal(true);
            expect($(this).hasClass(expectedValues[count])).to.equal(true);
            count++;
        });
    });

    it('should not apply row class if one is not configured', function () {
        delete elScope.rowStyle;
        delete elScope.rowStyleObject;
        scope.$digest();

        var count = 1;
        el.find('.data-row').each(function () {
            expect($(this).hasClass('item-color-mapping')).to.equal(false);
            expect($(this).hasClass('_' + count)).to.equal(false);
            count++;
        });
    });

    it('should set a row style based on boolean values', function () {
        validTemplate = '<rx-data-table\
            column-configuration="dtConfig" list-of-data="dtData"\
            row-style="{class: \'item-color-mapping\', field: \'assigned\',\
                bool: true}"></rx-data-table>';

        el = helpers.createDirective(validTemplate, compile, scope);
        elScope = el.isolateScope();

        expect(elScope.rowClass(scope.dtData[0])).to.equal('item-color-mapping');
        expect(elScope.rowClass(scope.dtData[4])).to.equal(undefined);
    });

    it('should not fail if there is a bad ng-class function not returning a valid class', function () {
        var col = scope.dtConfig[5];

        expect(elScope.getNGClass(col, scope.dtData[1])).to.deep.equal({});
    });

    it('should apply the row-key to every row', function () {
        elScope.predicate = ['severity'];
        scope.$digest();

        var count = 0;
        var expectedValues = ['123456', '654321', '789100', '140102-0000012', '140102'];

        el.find('.data-row').each(function () {
            expect($(this).attr('data-row-key')).to.equal(expectedValues[count]);
            count++;
        });
    });

    it('should build Table Data dataRows in default sort order', function () {
        var expectedValues = ['Test Item 5', 'Test Item 3', 'Test Item 4', 'Test Item 2', 'Test Item 1'];
        var count = 0;
        expect(elScope.predicate).to.deep.equal(['-severity']);

        el.find('.data-row').each(function () {
            expect($.trim($(this).find('[data-title="Subject"]').text())).to.equal(expectedValues[count]);
            count++;
        });
    });

    it('should build Table Data rows in clicked sort order', function () {
        var itemHeaderALink = el.find('.data-header-cell[data-title="Item"] button');
        // We're going to click on the Item Column and make sure it sorts by severity
        itemHeaderALink.click();

        scope.$digest();

        expect(elScope.predicate).to.include('-severity');

        var row1Subject = $.trim(el.find('.data-row-1 .data-cell[data-title="Subject"]').text());
        var row2Subject = $.trim(el.find('.data-row-2 .data-cell[data-title="Subject"]').text());
        var row3Subject = $.trim(el.find('.data-row-3 .data-cell[data-title="Subject"]').text());

        expect(row1Subject).to.equal('Test Item 5');
        expect(row2Subject).to.equal('Test Item 3');
        expect(row3Subject).to.equal('Test Item 4');

        itemHeaderALink.triggerHandler('click');
        scope.$digest();
        expect(elScope.predicate).to.include('-severity');
    });

    it('should convert between string and object predicates', function () {
        expect(elScope.decompilePredicateString('-severity')).to.deep.equal({
            'column': 'severity',
            'reverse': true
        });

        expect(elScope.compilePredicateString(scope.dtConfig[0])).to.equal('severity');
        expect(elScope.compilePredicateString(scope.dtConfig[0], true)).to.equal('-severity');
        expect(elScope.compilePredicateString('severity', true, true)).to.equal('-severity');
    });

    it('should pass through the predicate if it is not a string', function () {
        expect(elScope.decompilePredicateString(['severity'])).to.deep.equal(['severity']);
    });

    it('should add a table configuration menu when multi-sort or column show/hide is used', function () {
        expect(el.find('.data-table-config-icon').length).to.equal(1);
    });

    it('should add a multi-column when it is enabled', function () {
        expect(el.find('.data-table-multi-sort').length).to.equal(1);
    });

    it('should disable sorting on predicate="false"', function () {
        validTemplate = '<rx-data-table\
            column-configuration="dtConfig" list-of-data="dtData"\
            predicate="predicate"></rx-data-table>';

        scope.predicate = false;

        el = helpers.createDirective(validTemplate, compile, scope);
        elScope = el.isolateScope();

        expect(elScope.disableSorting).to.equal(true);
        expect(elScope.getPredicate()).to.deep.equal([]);
    });

    it('should set up default sort on undefined predicate', function () {
        validTemplate = '<rx-data-table\
            column-configuration="dtConfig" list-of-data="dtData">\
            </rx-data-table>';

        el = helpers.createDirective(validTemplate, compile, scope);
        elScope = el.isolateScope();

        expect(elScope.disableSorting).to.equal(undefined);
        expect(elScope.getPredicate()).to.deep.equal(['severity']);
    });

    it('should build a list for the select boxes in the multi column sort menu of sortable columns', function () {
        var options = elScope.getSortableColumnSelects();

        expect(options.length).to.equal(5);

        expect(options).to.deep.equal([
            {text: 'ID', value: 'severity'},
            {text: 'Subject', value: 'subject'},
            {text: 'Status', value: 'status'},
            {text: 'Assigned', value: 'assigned'},
            {text: 'Multi-Line Subject', value: 'subject'}
        ]);
    });

    it('should use add column when shift-clicking a column', function () {
        elScope.sort({shiftKey: true}, scope.dtConfig[1]);
        expect(elScope.predicate).to.deep.equal(['-severity', 'subject']);
    });

    it('should add a new column to the predicate', function () {
        elScope.addColumnSort(scope.dtConfig[1]);
        expect(elScope.predicate).to.deep.equal(['-severity', 'subject']);
    });

    it('should inverse the sort of a currently sorted column', function () {
        elScope.predicate = ['severity', 'subject'];
        elScope.addColumnSort(scope.dtConfig[0]);
        expect(elScope.predicate).to.deep.equal(['-severity', 'subject']);
    });

    it('should remove a sorted column of a currently sorted column', function () {
        elScope.predicate = ['-severity', 'subject'];
        elScope.addColumnSort(scope.dtConfig[0]);
        expect(elScope.predicate).to.deep.equal(['subject']);
    });

    it('should toggle the only remaining sort on adding a column', function () {
        elScope.predicate = ['-severity'];
        elScope.addColumnSort(scope.dtConfig[0]);
        expect(elScope.predicate).to.deep.equal(['severity']);
    });

    it('should reverse the predicate by index', function () {
        elScope.predicate = ['severity', 'subject'];
        elScope.reversePredicate(1);
        expect(elScope.predicate).to.deep.equal(['severity', '-subject']);
    });

    it('should remove the predicate by index', function () {
        elScope.predicate = ['severity', 'subject'];
        elScope.removePredicate(1);
        expect(elScope.predicate).to.deep.equal(['severity']);
        elScope.removePredicate(0);
        expect(elScope.predicate).to.deep.equal(['severity']);
    });

    it('should replace the predicate at the index with the specified value', function () {
        elScope.predicate = ['severity', 'subject'];
        elScope.updatePredicate(1, 'assigned');
        expect(elScope.predicate).to.deep.equal(['severity', 'assigned']);
        elScope.updatePredicate(1, 'ohBilly');
        expect(elScope.predicate).to.deep.equal(['severity', 'assigned']);
    });

    it('should build icons in the columns that have them defined', function () {
        var statusHeaderALink = el.find('.data-header-cell[data-title="Status"] button');
        statusHeaderALink.click();
        scope.$digest();

        expect(elScope.predicate).to.include('status');

        var row1Status = el.find('.data-row-1 .data-cell[data-title="Status"]');
        var row2Status = el.find('.data-row-3 .data-cell[data-title="Status"]');
        var row3Status = el.find('.data-row-3 .data-cell[data-title="Status"]');
        var row1StatusText = $.trim(row1Status.text());
        var row2StatusText = $.trim(row2Status.text());
        var row3StatusText = $.trim(row3Status.text());

        var row1StatusIcon = row1Status.find('.data-table-cell-icon');
        var row2StatusIcon = row2Status.find('.data-table-cell-icon');
        var row3StatusIcon = row3Status.find('.data-table-cell-icon');

        expect(row1StatusIcon.hasClass('item-state-img')).to.equal(true);
        expect(row2StatusIcon.hasClass('item-state-img')).to.equal(true);
        expect(row3StatusIcon.hasClass('item-state-img')).to.equal(true);
        expect(row1StatusText).to.equal('Feedback Pending');
        expect(row1StatusIcon.hasClass('item-state-img-pending')).to.equal(true);
        expect(row2StatusText).to.equal('New');
        expect(row2StatusIcon.hasClass('item-state-img-new')).to.equal(true);
        expect(row3StatusText).to.equal('New');
        expect(row3StatusIcon.hasClass('item-state-img-new')).to.equal(true);
    });

    it('should attach a help icon for columns that have it configured', function () {
        var itemHeaderHelp = el.find('.data-header-cell[data-title="ID"] i');

        expect(itemHeaderHelp.hasClass('fa-question-circle')).to.equal(true);
        expect(itemHeaderHelp.attr('data-popover')).to.equal('This field is sorted by severity, not the ref_no');
    });

    it('should should create x-editable elements for columns with config', function () {
        var row = el.find('.data-row[data-row-key="140102-0000012"]');

        var subjColumn = row.find('[data-title="Subject"] .data-cell-content span span span');
        var assnColumn = row.find('[data-title="Assigned"] .data-cell-content span span span');
        var statusColumn = row.find('[data-title="Status"] .data-cell-content span span span');

        expect(subjColumn.attr('editable-text')).to.equal('row[column.dataField]');
        expect(statusColumn.attr('editable-select')).to.equal('row[column.dataField]');
        expect(assnColumn.attr('editable-text')).to.equal('row[column.dataField]');
        expect(assnColumn.attr('e-typeahead')).to.equal(
            'o.value as o.text for o in getEditableOptions(column, row) | filter:$viewValue');
    });

    it('should return editable options for the select and typeahead', function () {
        var statusConfig = scope.dtConfig[2];
        var assigneeConfig = scope.dtConfig[3];

        var dataRow = scope.dtData[3];

        expect(elScope.getEditableOptions(statusConfig, dataRow)).to.equal(statusConfig.editable.options);
        expect(elScope.getEditableOptions(assigneeConfig, dataRow)).to.deep.equal(assigneeConfig.editable.data());

    });

    it('should return an empty array if the column is not configured to be editable', function () {
        expect(elScope.getEditableOptions(scope.dtConfig[4], scope.dtData[0])).to.deep.equal([]);
    });

    it('should return an empty array if data is not an array', function () {
        var col = {
            'title': 'Test',
            'dataField': 'test_field',
            'editable': {
                'clause': function () {
                    return true;
                },
                'data': function () {
                    return 'howdy';
                },
                'dataField': 'test_field',
                'endpoint': {
                    'url': '/api/item/{system}/{ref_no}',
                    'method': 'put'
                },
            }
        };

        expect(elScope.getEditableOptions(col, {'test_field': 'testing'})).to.deep.equal([]);
    });

    it('should return an empty array if there is no data or options flag', function () {
        var col = {
            'title': 'Test',
            'dataField': 'test_field',
            'editable': {
                'clause': function () {
                    return true;
                },
                'dataField': 'test_field',
                'endpoint': {
                    'url': '/api/item/{system}/{ref_no}',
                    'method': 'put'
                },
            }
        };

        expect(elScope.getEditableOptions(col, {'test_field': 'testing'})).to.deep.equal([]);
    });

    it('should create a null field link whenever a field is configured to', function () {

        var assnColumn = el.find('.data-row[data-row-key="140102-0000012"] [data-title="Assigned"]');
        var assnColumnContent = assnColumn.find('.data-cell-content');
        assnColumnContent.click();
        scope.$digest();
        var assnNullable = assnColumn.find('.data-table-field-nullable');

        expect(assnNullable.length).to.equal(1);
        helpers.clickElement(assnNullable);
        httpBackend.flush();
        expect(scope.dtData[3].assigned).to.equal(null);
    });

    it('should not allow nullable if the column is not configured for it', function () {
        /* jshint camelcase:false */
        var col = {
            'title': 'Test',
            'dataField': 'test_field',
            'editable': {
                'clause': function () {
                    return true;
                },
                'dataField': 'test_field',
                'endpoint': {
                    'url': '/api/item/{system}/{ref_no}',
                    'method': 'put'
                },
            }
        };

        var row = {'test_field': 'testing'};

        elScope.nullField(col, row);
        scope.$digest();
        expect(row.test_field).to.equal('testing');
    });

    it('should return false if a field is not editable', function () {
        /* jshint camelcase:false */
        var col = {
            'title': 'Test',
            'dataField': 'test_field'
        };

        var row = {'test_field': 'testing'};

        expect(elScope.updateField(col, row, 'test2', elScope)).to.equal(false);
    });


    it('should indicate field update status', function () {
        var statusConfig = scope.dtConfig[2];
        var dataRow = scope.dtData[3];

        expect(elScope.updateFieldStatus).to.equal(undefined);
        elScope.updateField(statusConfig, dataRow, 'Pending Maintenance');
        expect(elScope.updateFieldStatus).to.deep.equal({status:'saving',message:'Saving value for "Status"'});
        httpBackend.flush();
        expect(elScope.updateFieldStatus).to.deep.equal({status:'success',message:'Saved data for "Status" field'});
        timeout.flush();
        expect(elScope.updateFieldStatus).to.equal(undefined);
    });

    it('should indicate field update status failure', function () {
        var statusConfig = scope.dtConfig[2];
        var dataRow = scope.dtData[3];


        expect(elScope.updateFieldStatus).to.equal(undefined);
        elScope.updateField(statusConfig, dataRow, 'Pending');
        expect(elScope.updateFieldStatus).to.deep.equal(
            {status:'saving',message:'Saving value for "Status"'});
        httpBackend.flush();
        expect(elScope.updateFieldStatus).to.deep.equal(
            {status:'error',message:'Error saving data for "Status" field'});
        timeout.flush();
        expect(elScope.updateFieldStatus).to.equal(undefined);
    });

    it('should append the server error message when provided', function () {
        var statusConfig = scope.dtConfig[2];
        var dataRow = scope.dtData[3];

        expect(elScope.updateFieldStatus).to.equal(undefined);
        elScope.updateField(statusConfig, dataRow, 'Partying');
        expect(elScope.updateFieldStatus).to.deep.equal(
            {status:'saving',message:'Saving value for "Status"'});
        httpBackend.flush();
        expect(elScope.updateFieldStatus).to.deep.equal(
            {status:'error',message:'Error saving data for "Status" field\nYou can not party here'});
        timeout.flush();
        expect(elScope.updateFieldStatus).to.equal(undefined);
    });

    it('should run pre update and post update success methods', function () {
        var preUpdateWent = false;
        var postUpdateSuccessWent = false;
        var postUpdateErrorWent = false;
        var statusConfig = scope.dtConfig[2];
        var dataRow = scope.dtData[3];

        scope.$on('pre-update-method', function () {
            preUpdateWent = true;
        });
        scope.$on('post-update-success-method', function () {
            postUpdateSuccessWent = true;
        });
        scope.$on('post-update-error-method', function () {
            postUpdateErrorWent = true;
        });

        elScope.updateField(statusConfig, dataRow, 'Pending Maintenance');
        httpBackend.flush();

        expect(preUpdateWent).to.equal(true);
        expect(postUpdateSuccessWent).to.equal(true);
        expect(postUpdateErrorWent).to.equal(false);
    });

    it('should not run the update if pre update fails', function () {
        var preUpdateWent = false;
        var postUpdateSuccessWent = false;
        var postUpdateErrorWent = false;
        var dataRow = scope.dtData[3];
        var statusConfig = {
            'title': 'Status',
            'dataField': 'status',
            'editable': {
                'clause': function (row) {
                    return (row.system == 'Manual');
                },
                'options': [
                    { value: 'In Progress', text: 'In Progress'},
                    { value: 'Pending Vendor', text: 'Pending Vendor'},
                    { value: 'Pending Customer', text: 'Pending Customer'},
                    { value: 'Pending Maintenance', text: 'Pending Maintenance'},
                    { value: 'Solved', text: 'Solved'}
                ],
                'preUpdate': function (column, row, newData) {
                    scope.$emit('pre-update-method', column, row, newData);
                    return false;
                },
                'postUpdateSuccess': function (column, row, newData) {
                    scope.$emit('post-update-success-method', column, row, newData);
                },
                'postUpdateError': function (column, row, newData) {
                    scope.$emit('post-update-error-method', column, row, newData);
                },
                'endpoint': {
                    'url': '/api/item/{system}/{ref_no}',
                    'method': 'put'
                }
            },
        };

        scope.$on('pre-update-method', function () {
            preUpdateWent = true;
        });
        scope.$on('post-update-success-method', function () {
            postUpdateSuccessWent = true;
        });
        scope.$on('post-update-error-method', function () {
            postUpdateErrorWent = true;
        });

        elScope.updateField(statusConfig, dataRow, 'Pending Maintenance');

        expect(preUpdateWent).to.equal(true);
        expect(postUpdateSuccessWent).to.equal(false);
        expect(postUpdateErrorWent).to.equal(false);
    });

    it('should run post update error method', function () {
        var postUpdateErrorWent = false;
        var statusConfig = scope.dtConfig[2];
        var dataRow = scope.dtData[3];

        scope.$on('post-update-error-method', function () {
            postUpdateErrorWent = true;
        });

        elScope.updateField(statusConfig, dataRow, 'Pending');
        httpBackend.flush();

        expect(postUpdateErrorWent).to.equal(true);
    });

    it('should return false for a field that is not editable', function () {
        expect(elScope.getEditType(scope.dtConfig[0], scope.dtData[0])).to.equal(false);
    });

    it('should shift a column down', function () {
        expect(scope.dtColumnDisplay.config[0]).to.equal(0);
        elScope.moveColumnDown(0);
        expect(scope.dtColumnDisplay.config[0]).to.equal(1);
    });

    it('should shift a column up', function () {
        expect(scope.dtColumnDisplay.config[1]).to.equal(1);
        elScope.moveColumnUp(1);
        expect(scope.dtColumnDisplay.config[1]).to.equal(0);
    });

    it('should not shift a column out of range', function () {
        expect(scope.dtColumnDisplay.config[0]).to.equal(0);
        expect(scope.dtColumnDisplay.config[4]).to.equal(5);
        elScope.moveColumnUp(0);
        elScope.moveColumnDown(4);
        expect(scope.dtColumnDisplay.config[0]).to.equal(0);
        expect(scope.dtColumnDisplay.config[4]).to.equal(5);
    });

    it('should remove a column from the display', function () {
        expect(scope.dtColumnDisplay.config.length).to.equal(5);
        elScope.removeColumn(4);
        expect(scope.dtColumnDisplay.config.length).to.equal(4);
    });

    it('should add a column to the display', function () {
        expect(scope.dtColumnDisplay.config.length).to.equal(5);
        elScope.showColumn(4);
        expect(scope.dtColumnDisplay.config.length).to.equal(6);
    });

    it('should have a default notify duration', function () {
        expect(elScope.defaultNotificationDuration).to.equal(3000);
    });

    it('should bring in a passed in notification duration', function () {
        validTemplate = '<rx-data-table row-key="ref_no" visibilty="true"\
            column-configuration="dtConfig" list-of-data="dtData"\
            column-display="dtColumnDisplay" column-presets="dtColumnPresets"\
            predicate="predicate"\
            row-style="{class: \'item-color-mapping\', field: \'severity\',\
                bool: false}"\
            column-multi-sort="true" column-reordering="true"\
            notify-duration="5000"></rx-data-table>';

        el = helpers.createDirective(validTemplate, compile, scope);
        elScope = el.isolateScope();

        expect(elScope.defaultNotificationDuration).to.equal(5000);
    });

    it('should support multiple fields displaying in one cell', function () {
        var expected = '140102-0000012\nTest Item 4';
        var multiField = el.find('.data-row[data-row-key="140102-0000012"] [data-title="Multi-Line Subject"]');
        var multiFieldContent = multiField.find('.data-cell-content');
        expect($.trim(multiFieldContent.text())).to.equal(expected);
        expect(filter('ColumnValue')(scope.dtData[3], scope.dtConfig[5])).to.equal(expected);
    });

    it('should broadcast an error message on data-table-error', function () {
        elScope.$emit('data-table-error', 'This is a problem', 2500);
        scope.$digest();
        expect(elScope.updateFieldStatus).to.deep.equal({'status': 'error',
                'message': 'This is a problem'});
        timeout.flush(1000);
        expect(elScope.updateFieldStatus).to.deep.equal({'status': 'error',
                'message': 'This is a problem'});
        timeout.flush(2500);
        expect(elScope.updateFieldStatus).to.equal(undefined);
    });

    it('should set column display index to zero if it is not a valid number', function () {
        elScope.columnDisplay.index = undefined;
        elScope.getPresetConfiguration();
        expect(elScope.columnDisplay.index).to.equal(0);
    });

    it('should mark a preset as custom', function () {
        expect(elScope.columnDisplay.index).to.equal(0);
        elScope.markPresetAsCustom();
        expect(elScope.columnDisplay.index).to.equal(2);
        elScope.columnDisplay.index = 0;
        elScope.markPresetAsCustom();
        expect(elScope.columnDisplay.index).to.equal(2);
    });

    it('should toggle configuration visibility', function () {
        expect(elScope.configurationVisible).to.equal(false);
        elScope.toggleVisibility();
        expect(elScope.configurationVisible).to.equal(true);
        elScope.toggleVisibility();
        expect(elScope.configurationVisible).to.equal(false);
    });

    it('should hide configuration visibility on document click', function () {
        elScope.configurationVisible = true;
        document.click();
        expect(elScope.configurationVisible).to.equal(false);
    });
});
