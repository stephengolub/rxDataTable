/* jshint node: true */
/* jshint multistr: true */
describe('Data Table Directive', function () {
    var el, scope, compile, elScope, document, rebuildStructure, httpBackend, timeout,
        validTemplate = '<rx-data-table row-key="ref_no" pager="pager" visibilty="true"\
            column-configuration="dtConfig" list-of-data="dtData" total-columns="12"\
            column-display="dtColumnDisplay" column-presets="dtColumnPresets"\
            default-sort="[\'-severity\']"\
            row-style="{class: \'ticket-severity\', field: \'severity\',\
                bool: false}"\
            column-multi-sort="true" column-reordering="true"\
            checkbox-event="checkEvent"></rx-data-table>';

    beforeEach(function () {
        module('encore');
        module('rxTicketQueueModule');

        // We need to load all of the templates that are going to be used
        module('views/templates/rx-data-table.html');
        module('views/templates/paginate.html');
        module('views/templates/itemsPerPage.html');

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
                    'title': 'Ticket',
                    'dataField': 'ref_no',
                    'sortField': 'severity',
                    'linkField': 'ticket_link',
                    'hideable': false,
                    'cols': '2',
                    'class': 'ticket-severity',
                    'help': {
                        'body': 'This field is sorted by severity, not the ticket number'
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
                            'url': '/api/ticket/{system}/{ref_no}',
                            'method': 'put'
                        }
                    }
                },
                {
                    'title': 'Status',
                    'cols': '2',
                    'dataField': 'status',
                    'class': 'ticket-status',
                    'editable': {
                        'clause': function (row) {
                            return (row.system == 'Encore');
                        },
                        'options': [
                            { value: 'In Progress', text: 'In Progress'},
                            { value: 'Pending Vendor', text: 'Pending Vendor'},
                            { value: 'Pending Customer', text: 'Pending Customer'},
                            { value: 'Pending Maintenance', text: 'Pending Maintenance'},
                            { value: 'Solved', text: 'Solved'}
                        ],
                        'endpoint': {
                            'url': '/api/ticket/{system}/{ref_no}',
                            'method': 'put'
                        }
                    },
                    'icon': [
                        {
                            'field': 'state',
                            'class': 'ticket-state-img ticket-state-img-new',
                            'fieldValue': 'New'
                        },
                        {
                            'field': 'state',
                            'class': 'ticket-state-img ticket-state-img-feedback-received',
                            'fieldValue': 'Feedback Received'
                        },
                        {
                            'field': 'state',
                            'class': 'ticket-state-img ticket-state-img-active',
                            'fieldValue': 'Active'
                        },
                        {
                            'field': 'state',
                            'class': 'ticket-state-img ticket-state-img-solved',
                            'fieldValue': 'Solved'
                        },
                        {
                            'field': 'state',
                            'class': 'ticket-state-img ticket-state-img-scheduled',
                            'fieldValue': 'Scheduled'
                        },
                        {
                            'field': 'state',
                            'class': 'ticket-state-img ticket-state-img-pending',
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
                            return (row.system === 'Encore')&&(row.group !== '');
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
                            'url': '/api/ticket/{system}/{ref_no}',
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
                    'ticket_link': 'http://www.google.com',
                    'subject': 'Test Ticket 1',
                    'assigned': 'Chris Cantu',
                    'status': 'Feedback Received',
                    'state': 'Feedback Received',
                    'system': 'Core'
                },
                {
                    'ref_no': '654321',
                    'severity': 2,
                    'ticket_link': 'http://www.google.com',
                    'subject': 'Test Ticket 2',
                    'assigned': 'Roger Enriquez',
                    'status': 'New',
                    'state': 'New',
                    'system': 'Zendesk'
                },
                {
                    'ref_no': '789100',
                    'severity': 3,
                    'ticket_link': 'http://www.rackspace.com',
                    'subject': 'Test Ticket 3',
                    'assigned': 'Andrew Yurisich',
                    'status': 'Feedback Pending',
                    'state': 'Pending',
                    'system': 'Core'
                },
                {
                    'ref_no': '140102-ord-0000012',
                    'severity': 3,
                    'ticket_link': 'http://www.rackspace.com',
                    'subject': 'Test Ticket 4',
                    'assigned': 'Andrew Yurisich',
                    'status': 'Pending Customer',
                    'state': 'Pending',
                    'system': 'Encore'
                }
            ];

            scope.pager = PageTracking.createInstance();
            // Now we need to grab the individual templates and put them in the
            // cache. This has to be done instead of the whenGET calls due to
            // the URL and Filepaths not being the same.
            var datatabhtml = $templateCache.get('views/templates/rx-data-table.html');
            $templateCache.put('/views/templates/rx-data-table.html', datatabhtml);
            var paginateHtml = $templateCache.get('views/templates/paginate.html');
            $templateCache.put('/views/templates/paginate.html', paginateHtml);
            var itemsPerPageHtml = $templateCache.get('views/templates/itemsPerPage.html');
            $templateCache.put('/views/templates/itemsPerPage.html', itemsPerPageHtml);

            /* jshint maxlen:1000 */
            httpBackend.when('PUT', '/api/ticket/Encore/140102-ord-0000012', '{"assigned":null}').respond('{ "ref_no": "140102-ord-0000012", "severity": 3, "ticket_link": "http://www.rackspace.com", "subject": "Test Ticket 4", "assigned": null, "status": "Pending Customer", "state": "Pending", "system": "Encore" }');
            httpBackend.when('PUT', '/api/ticket/Encore/140102-ord-0000012', '{"status":"Pending Maintenance"}').respond('{ "ref_no": "140102-ord-0000012", "severity": 3, "ticket_link": "http://www.rackspace.com", "subject": "Test Ticket 4", "assigned": "Andrew Yurisich", "status": "Pending Maintenance", "state": "Pending", "system": "Encore" }');

            httpBackend.when('PUT', '/api/ticket/Encore/140102-ord-0000012', '{"status":"Pending"}').respond(400, 'Traceback (most recent call last):\n File "/Users/step1179/Vagrant/Flow/chunky_bacon/backend/lib/python3.3/site-packages/tornado-3.1-py3.3.egg/tornado/web.py", line 1115, in _stack_context_handle_exception\n raise_exc_info((type, value, traceback))\n File "<string>", line 3, in raise_exc_info\n File "/Users/step1179/Vagrant/Flow/chunky_bacon/backend/lib/python3.3/site-packages/tornado-3.1-py3.3.egg/tornado/web.py", line 1298, in wrapper\n result = method(self, *args, **kwargs)\n File "/Users/step1179/Vagrant/Flow/chunky_bacon/backend/lib/python3.3/site-packages/tornado-3.1-py3.3.egg/tornado/gen.py", line 140, in wrapper\n result = func(*args, **kwargs)\n File "/Users/step1179/Vagrant/Flow/chunky_bacon/backend/application/data/validator.py", line 34, in _handler\n raise HTTPError(400, \', \'.join(v.errors))\n tornado.web.HTTPError: HTTP 400: Bad Request (status)');
            rebuildStructure = function (scope) {
                var headerRow, headerColumns, dataRows;

                if (scope) {
                    scope.$digest();
                }

                headerRow = el.find('.data-header');
                headerColumns = headerRow.find('.data-header-cell');
                dataRows = el.find('.data-row');

                return {headerRow: headerRow, headerColumns: headerColumns, dataRows: dataRows};
            };
        });

        el = helpers.createDirective(validTemplate, compile, scope);

        elScope = el.isolateScope();

    });

    afterEach(function () {
        // zero out element
        el = null;
    });

    it('should build Table Headings from Configuration Data ', function () {
        var tableStructure = rebuildStructure();
        expect(tableStructure.headerRow.hasClass('data-header')).to.equal(true);
        expect(tableStructure.headerColumns.length).to.equal(5);
    });

    it('should build Table Data dataRows from Configuration Data', function () {
        var tableStructure = rebuildStructure();

        expect(tableStructure.dataRows.length).to.equal(4);
    });

    it('should apply configured row class to every row', function () {
        elScope.predicate = ['severity'];
        var rows = rebuildStructure(scope).dataRows;
        var count = 0;
        var expectedValues = ['_1', '_2', '_3', '_3'];

        rows.each(function () {
            expect($(this).hasClass('ticket-severity')).to.equal(true);
            expect($(this).hasClass(expectedValues[count])).to.equal(true);
            count++;
        });
    });

    it('should not apply row class if one is not configured', function () {
        delete elScope.rowStyle;
        delete elScope.rowStyleObject;

        var rows = rebuildStructure(elScope).dataRows;
        var count = 1;
        rows.each(function () {
            expect($(this).hasClass('ticket-severity')).to.equal(false);
            expect($(this).hasClass('_' + count)).to.equal(false);
            count++;
        });
    });

    it('should apply the row-key to every row', function () {
        elScope.predicate = ['severity'];
        var rows = rebuildStructure(scope).dataRows;
        var count = 0;
        var expectedValues = ['123456', '654321', '789100', '140102-ord-0000012'];
        
        rows.each(function () {
            expect($(this).attr('data-row-key')).to.equal(expectedValues[count]);
            count++;
        });
    });

    it('should build Table Data dataRows in default sort order', function () {
        var rows = rebuildStructure().dataRows;
        var expectedValues = ['Test Ticket 3', 'Test Ticket 4', 'Test Ticket 2', 'Test Ticket 1'];
        var count = 0;
        expect(elScope.predicate).to.deep.equal(['-severity']);

        rows.each(function () {
            expect($.trim($(this).find('[data-title="Subject"]').text())).to.equal(expectedValues[count]);
            count++;
        });
    });

    it('should build Table Data rows in clicked sort order', function () {
        var structure = rebuildStructure();
        var ticketHeaderCell = helpers.getChildDiv(structure.headerRow, 'Ticket');
        var ticketHeaderALink = ticketHeaderCell.children('button');
        // We're going to click on the Ticket Column and make sure it sorts by
        // severity
        ticketHeaderALink.triggerHandler('click');

        var rows = rebuildStructure().dataRows;

        expect(elScope.predicate).to.include('severity');

        var row1Subject = helpers.getChildDivText(rows[0], 'Subject');
        var row2Subject = helpers.getChildDivText(rows[1], 'Subject');
        var row3Subject = helpers.getChildDivText(rows[2], 'Subject');

        expect(row1Subject).to.equal('Test Ticket 1');
        expect(row2Subject).to.equal('Test Ticket 2');
        expect(row3Subject).to.equal('Test Ticket 3');

        ticketHeaderALink.triggerHandler('click');
        rows = rebuildStructure().dataRows;
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
            {text: 'Ticket', value: 'severity'},
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
        var structure = rebuildStructure();
        var statusHeaderCell = helpers.getChildDiv(structure.headerRow, 'Status');
        var statusHeaderALink = statusHeaderCell.children('button');
        statusHeaderALink.triggerHandler('click');
        var rows = rebuildStructure(scope).dataRows;

        expect(elScope.predicate).to.include('status');

        var row1Status = helpers.getChildDiv(rows[0], 'Status');
        var row2Status = helpers.getChildDiv(rows[1], 'Status');
        var row3Status = helpers.getChildDiv(rows[2], 'Status');
        var row1StatusText = helpers.getChildDivText(rows[0], 'Status');
        var row2StatusText = helpers.getChildDivText(rows[1], 'Status');
        var row3StatusText = helpers.getChildDivText(rows[2], 'Status');

        var row1StatusIcon = helpers.getChildDiv(row1Status.children('div'), 'data-table-cell-icon', 'class');
        var row2StatusIcon = helpers.getChildDiv(row2Status.children('div'), 'data-table-cell-icon', 'class');
        var row3StatusIcon = helpers.getChildDiv(row3Status.children('div'), 'data-table-cell-icon', 'class');

        expect(row1StatusIcon.hasClass('ticket-state-img')).to.equal(true);
        expect(row2StatusIcon.hasClass('ticket-state-img')).to.equal(true);
        expect(row3StatusIcon.hasClass('ticket-state-img')).to.equal(true);
        expect(row1StatusText).to.equal('Feedback Pending');
        expect(row1StatusIcon.hasClass('ticket-state-img-pending')).to.equal(true);
        expect(row2StatusText).to.equal('Feedback Received');
        expect(row2StatusIcon.hasClass('ticket-state-img-feedback-received')).to.equal(true);
        expect(row3StatusText).to.equal('New');
        expect(row3StatusIcon.hasClass('ticket-state-img-new')).to.equal(true);
    });

    it('should attach a help icon for columns that have it configured', function () {
        var structure = rebuildStructure();
        var ticketHeaderCell = helpers.getChildDiv(structure.headerRow, 'Ticket');
        var ticketHeaderALink = ticketHeaderCell.children('button');
        var ticketHeaderHelp = ticketHeaderALink.children('i');
        var firstIcon = angular.element(ticketHeaderHelp);

        expect(firstIcon.hasClass('fa-question-circle')).to.equal(true);
        expect(firstIcon.attr('data-popover')).to.equal('This field is sorted by severity, not the ticket number');
    });

    it('should make a checkbox column for the configured columns', function () {
        var structure = rebuildStructure();
        var checkboxHeaderCell = angular.element(structure.headerColumns[0]);
        var checkboxHeaderCheckbox = angular.element(checkboxHeaderCell.find('input'));

        checkboxHeaderCheckbox.triggerHandler('click');
        structure = rebuildStructure();
        checkboxHeaderCell = angular.element(structure.headerColumns[0]);
        checkboxHeaderCheckbox = angular.element(checkboxHeaderCell.find('input'));
    });

    it('should should create x-editable elements for columns with config', function () {
        var row = el.find('.data-row[data-row-key="140102-ord-0000012"]');

        var subjColumn = row.find('[data-title="Subject"] .data-cell-content span span');
        var assnColumn = row.find('[data-title="Assigned"] .data-cell-content span span');
        var statusColumn = row.find('[data-title="Status"] .data-cell-content span span');

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

        var assnColumn = el.find('.data-row[data-row-key="140102-ord-0000012"] [data-title="Assigned"]');
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
