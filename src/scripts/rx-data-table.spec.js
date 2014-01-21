/* jshint node: true */
/* jshint multistr: true */
describe('Data Table Directive', function () {
    var el, scope, compile, elScope, document, httpBackend, timeout,
        validTemplate = '<rx-data-table row-key="ref_no" pager="pager" visibilty="true"\
            column-configuration="dtConfig" list-of-data="dtData" total-columns="12"\
            column-display="dtColumnDisplay" column-presets="dtColumnPresets"\
            default-sort="[\'-severity\']"\
            row-style="{class: \'item-color-mapping\', field: \'severity\',\
                bool: false}"\
            column-multi-sort="true" column-reordering="true"\
            checkbox-event="checkEvent"></rx-data-table>';

    beforeEach(function () {
        module('rxDataTable');

        // We need to load all of the templates that are going to be used
        module('rx-data-table.html');
        module('rx-data-table-paginate.html');
        module('rx-data-table-itemsPerPage.html');

        // Inject in angular constructs
        inject(function($rootScope, $compile, $document, $timeout,
                $templateCache, $httpBackend, PageTracking) {
            scope = $rootScope.$new();
            compile = $compile;
            document = $document;
            httpBackend = $httpBackend;
            timeout = $timeout;

            scope.checkEvent = function (checkId, checkBox, checkStatus) {
                return checkStatus;
            };
            scope.dtConfig = [
                {
                    'checkbox': true,
                    'checkAll': true,
                    'dataField': 'ref_no',
                    'cols': 1
                },
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
                    'ng-class': '{"_1": row.severity== 1, "_2": row.severity == 2,\
                        "_3": row.severity == 3, "_4": row.severity >= 4}'
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
                }
            ];

            scope.dtColumnPresets = [
                {
                    'title': 'Default View',
                    'config': [0,1,2,3,4]
                },
                {
                    'title': 'Non Editable Assignee',
                    'config': [0,1,2,3,5]
                }
            ];

            scope.dtColumnDisplay = {
                'index': 0,
                'config': [0,1,2,3,4]
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
                }
            ];

            scope.pager = PageTracking.createInstance();
            // Now we need to grab the individual templates and put them in the
            // cache. This has to be done instead of the whenGET calls due to
            // the URL and Filepaths not being the same.

            /* jshint maxlen:1000 */
            httpBackend.when('PUT', '/api/item/Manual/140102-0000012', '{"assigned":null}').respond('{ "ref_no": "140102-0000012", "severity": 3, "item_link": "http://www.rackspace.com", "subject": "Test Item 4", "assigned": null, "status": "Pending Customer", "state": "Pending", "system": "Manual" }');
            httpBackend.when('PUT', '/api/item/Manual/140102-0000012', '{"status":"Pending Maintenance"}').respond('{ "ref_no": "140102-0000012", "severity": 3, "item_link": "http://www.rackspace.com", "subject": "Test Item 4", "assigned": "Andrew Yurisich", "status": "Pending Maintenance", "state": "Pending", "system": "Manual" }');

            httpBackend.when('PUT', '/api/item/Manual/140102-0000012', '{"status":"Pending"}').respond(400, 'Failure');
        });

        el = helpers.createDirective(validTemplate, compile, scope);

        elScope = el.isolateScope();

    });

    afterEach(function () {
        // zero out element
        el = null;
    });

    it('should build Table Headings from Configuration Data ', function () {
        expect(el.find('.data-header .data-header-cell').length).to.equal(5);
    });

    it('should build Table Data dataRows from Configuration Data', function () {
        expect(el.find('.data-row').length).to.equal(4);
    });

    it('should apply configured row class to every row', function () {
        elScope.predicate = ['severity'];
        scope.$digest();
        var count = 0;
        var expectedValues = ['_1', '_2', '_3', '_3'];

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

    it('should apply the row-key to every row', function () {
        elScope.predicate = ['severity'];
        scope.$digest();

        var count = 0;
        var expectedValues = ['123456', '654321', '789100', '140102-0000012'];
        
        el.find('.data-row').each(function () {
            expect($(this).attr('data-row-key')).to.equal(expectedValues[count]);
            count++;
        });
    });

    it('should build Table Data dataRows in default sort order', function () {
        var expectedValues = ['Test Item 3', 'Test Item 4', 'Test Item 2', 'Test Item 1'];
        var count = 0;
        expect(elScope.predicate).to.deep.equal(['-severity']);

        el.find('.data-row').each(function () {
            expect($.trim($(this).find('[data-title="Subject"]').text())).to.equal(expectedValues[count]);
            count++;
        });
    });

    it('should build Table Data rows in clicked sort order', function () {
        var itemHeaderALink = el.find('.data-header-cell[data-title="Item"] button');
        // We're going to click on the Item Column and make sure it sorts by
        // severity
        itemHeaderALink.click();

        scope.$digest();

        expect(elScope.predicate).to.include('-severity');

        var row1Subject = $.trim(el.find('.data-row-1 .data-cell[data-title="Subject"]').text());
        var row2Subject = $.trim(el.find('.data-row-2 .data-cell[data-title="Subject"]').text());
        var row3Subject = $.trim(el.find('.data-row-3 .data-cell[data-title="Subject"]').text());

        expect(row1Subject).to.equal('Test Item 3');
        expect(row2Subject).to.equal('Test Item 4');
        expect(row3Subject).to.equal('Test Item 2');

        itemHeaderALink.triggerHandler('click');
        scope.$digest();
        expect(elScope.predicate).to.include('-severity');
    });

    it('should convert between string and object predicates', function () {
        expect(elScope.decompilePredicateString('-severity')).to.deep.equal({
            'column': 'severity',
            'reverse': true
        });

        expect(elScope.compilePredicateString(scope.dtConfig[1])).to.equal('severity');
        expect(elScope.compilePredicateString(scope.dtConfig[1], true)).to.equal('-severity');
        expect(elScope.compilePredicateString('severity', true, true)).to.equal('-severity');
    });

    it('should add a table configuration menu when multi-sort or column show/hide is used', function () {
        expect(el.find('.data-table-config-icon').length).to.equal(1);
    });

    it('should add a multi-column when it is enabled', function () {
        expect(el.find('.data-table-multi-sort').length).to.equal(1);
    });

    it('should build a list for the select boxes in the multi column sort menu of sortable columns', function () {
        var options = elScope.getSortableColumnSelects();

        expect(options.length).to.equal(4);

        expect(options).to.deep.equal([
            {text: 'ID', value: 'severity'},
            {text: 'Subject', value: 'subject'},
            {text: 'Status', value: 'status'},
            {text: 'Assigned', value: 'assigned'}
        ]);
    });

    it('should use add column when shift-clicking a column', function () {
        elScope.sort({shiftKey: true}, scope.dtConfig[2]);
        expect(elScope.predicate).to.deep.equal(['-severity', 'subject']);
    });

    it('should add a new column to the predicate', function () {
        elScope.addColumnSort(scope.dtConfig[2]);
        expect(elScope.predicate).to.deep.equal(['-severity', 'subject']);
    });

    it('should inverse the sort of a currently sorted column', function () {
        elScope.predicate = ['severity', 'subject'];
        elScope.addColumnSort(scope.dtConfig[1]);
        expect(elScope.predicate).to.deep.equal(['-severity', 'subject']);
    });

    it('should remove a sorted column of a currently sorted column', function () {
        elScope.predicate = ['-severity', 'subject'];
        elScope.addColumnSort(scope.dtConfig[1]);
        expect(elScope.predicate).to.deep.equal(['subject']);
    });

    it('should toggle the only remaining sort on adding a column', function () {
        elScope.predicate = ['-severity'];
        elScope.addColumnSort(scope.dtConfig[1]);
        expect(elScope.predicate).to.deep.equal(['severity']);
    });

    it('should sort by the first column if no default sort is provided', function () {
        delete elScope.defaultSort;
        expect(elScope.getDefaultPredicate()).to.deep.equal(['ref_no']);
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
        var statusConfig = scope.dtConfig[3];
        var assigneeConfig = scope.dtConfig[4];

        var dataRow = scope.dtData[3];

        expect(elScope.getEditableOptions(statusConfig, dataRow)).to.equal(statusConfig.editable.options);
        expect(elScope.getEditableOptions(assigneeConfig, dataRow)).to.deep.equal(assigneeConfig.editable.data());

    });

    it('should create a null field link whenever a field is configured to', function () {

        var assnColumn = el.find('.data-row[data-row-key="140102-0000012"] [data-title="Assigned"]');
        var assnColumnContent = assnColumn.find('.data-cell-content');
        assnColumnContent.click();
        scope.$digest();
        var assnNullable = assnColumn.find('.data-table-field-nullable');

        expect(assnNullable.length).to.equal(1);
        assnNullable.click();
        httpBackend.flush();
        expect(scope.dtData[3].assigned).to.equal(null);
    });

    it('should indicate field update status', function () {
        var statusConfig = scope.dtConfig[3];
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
        var statusConfig = scope.dtConfig[3];
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

    it('should return false for a field that is not editable', function () {
        expect(elScope.getEditType(scope.dtConfig[1], scope.dtData[0])).to.equal(false);
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
        expect(scope.dtColumnDisplay.config[4]).to.equal(4);
        elScope.moveColumnUp(0);
        elScope.moveColumnDown(4);
        expect(scope.dtColumnDisplay.config[0]).to.equal(0);
        expect(scope.dtColumnDisplay.config[4]).to.equal(4);
    });

    it('should remove a column from the display', function () {
        expect(scope.dtColumnDisplay.config.length).to.equal(5);
        elScope.removeColumn(4);
        expect(scope.dtColumnDisplay.config.length).to.equal(4);
    });

    it('should add a column to the display', function () {
        expect(scope.dtColumnDisplay.config.length).to.equal(5);
        elScope.showColumn(5);
        expect(scope.dtColumnDisplay.config.length).to.equal(6);
    });
});
