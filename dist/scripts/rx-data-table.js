/* jshint maxlen: 1000 */
var app = angular.module('rxDataTable', []);
/**
 *
 * @ngdoc directive
 * @namespace rxDataTable
 * @name rxDataTable
 * @restrict E
 * @description
 * Directive that creates a data table with responsive design properties. This
 * requires the following directives:
 *
 * - {@link rxDataTable.paginate:rxPaginate rxPaginate} Pagination Directive
 * - {@link rxDataTable.paginate:rxItemsPerPage rxItemsPerPage} Items per Page Directive
 * 
 * @param {Object} pager This is the page tracking object for the directive. If
 * no page tracking object is passed in, then the data table will be shown
 * without pagination.
 * @param {Array.<Object>=} list-of-data This is the list of data that the data table will represent 
 * @param {string=} default-sort This is the default sort predicate. This should
 *                                   should be a string that will evaluate to
 *                                   an array of predicates. (i.e. **`"['-severity']"`**)
 * @param {string=} row-key This is the attribute of the data objects that will
 *                       be used to attatch a data-value-key paramater to each
 *                       row of the table
 * @param {string='Items'} item-name This is what the data table will fill in
 *                      to indicate what the items in it really are.
 * @param {function=} checkbox-event The function that you want to run whenever
 * a checkbox is clicked. Only used for a checkbox field. This takes the
 * following arguments: **`chkBoxKey`**, **`chkBox`**, **`chkBoxCheckedStatus`**
 * @param {string=} row-style This is an object in a string format that is parsed
 *    in the code and applied to each row in the table.
 *
 *    It takes three attributes:
 *
 *    - **`class`** `{string}`: This is the class that gets to the row.
 *    - **`field`** `{string}`: This is the data field that the comparisons will be made against.
 *    - **`bool`** `{boolean}`: If true, then it just checks the field to see if it's truthy and applies the class. If it's false (default), then the value of the field is applied as a class along with the value in the class attribute. To account for non-string data values in the field, this will check to see if the first character in the field value is numerical, if it is, it prepends the value with an underscore (\_).  So, for example, if you have your class as data-service-level and the field value turns out to be a 2, then the class attribute of the row will be **`class="data-service-level _2"`**. This allows you to grab that row with **`.data-service-level._2`** and apply CSS values to it.
 *                              
 * @param {Object} column-display This object will hold the current display
 *    state of the various columns in the data table. It has/needs two
 *    properties:
 *
 *    - **`index`** `{integer}` This is the current column preset index that is
 *      selected.
 *    - **`config`** `{array.<integer>}` This is the list of the currently displayed
 *      column indices from the `columnConfiguration` object
 * @param {array.<Object>} column-presets This is a list of objects that
 *    configure the available column presets for the data table. The format of
 *    each object should be as follows:
 *    
 *    - **`title`** `{string}` This is the title of the preset that will show in the
 *      dropdown
 *    - **`config`** `{array.<integer>}` This is the list of indices from the
 *      columnConfiguration object that will be displayed. Order matters.
 * @param {string=} column-multi-sort This is a string taking value of `true` or
 *    `false`. If `true`, the multi-sorting capabilities of the table will be
 *    enabled. Value is `false` by default.
 * @param {string=} column-reordering This is a string taking value of `true`
 *    or `false`. If `true`, the `columnReordering` and presets are enabled.
 *    Default is `false`.
 * @param {array.<object>} column-configuration This are the available column definitions, see the
 *    extended information for this in the {@link #/guides/rx-data-table#column-object Data Table Guide}
 */
app.directive('rxDataTable', function ($http, $timeout, $document, $filter, PageTracking) {
    return {
        restrict: 'E',
        templateUrl: 'src/templates/rx-data-table.html',
        replace: true,
        scope: {
            pager: '=?',
            columnConfiguration: '=',
            columnDisplay: '=',
            columnPresets: '=',
            rowKey: '@',
            rowStyle: '@',
            itemName: '@',
            listOfData: '&',
            defaultSort: '@',
            checkboxEvent: '&',
            columnMultiSort: '@',
            columnReordering: '@'
        },
        link: function (scope) {
            /* jshint evil: true */

            scope.configurationVisible = false;
            scope.enableColumnMultiSort = (!_.isEmpty(scope.columnMultiSort)) ? scope.columnMultiSort : false;
            scope.enableColumnReordering = (!_.isEmpty(scope.columnReordering)) ? scope.columnReordering : false;

            if (_.isUndefined(scope.pager)) {
                scope.pager = PageTracking.createInstance();
            }

            scope.getSortField = function (column) {
                return (column.sortField||(column.sortField !== false)) && column.sortField || column.dataField;
            };

            scope.allowEditing = function (column, row) {
                return ((_.has(column, 'editable')) && (column.editable.clause(row)));
            };

            scope.getEditType = function (column, row) {
                if (scope.allowEditing(column, row)) {
                    if (_.has(column.editable, 'data')) {
                        return 'typeahead';
                    } else if (_.has(column.editable, 'options')) {
                        return 'select';
                    } else {
                        return 'text';
                    }
                } else {
                    return false;
                }
            };

            scope.getNGClass = function (column, row) {
                var classes = {};
                if (_.has(column, 'editable') && _.has(column.editable, 'nullable')) {
                    classes.nullable = column.editable.nullable;
                }

                if (_.has(column, 'ng-class') && _.isFunction(column['ng-class'])) {
                    var classFunction = column['ng-class'];
                    var classValue = classFunction(row);

                    if (!_.isEmpty(classValue)) {
                        classes[classValue] = true;
                    }
                } else if (_.has(column, 'ng-class') && _.isObject(column['ng-class'])) {
                    classes.extend(column['ng-class']);
                }

                return classes;
            };

            scope.getEditableOptions = function (column, row) {
                if (_.has(column, 'editable')) {
                    var editable = column.editable;
                    if (_.has(editable, 'data')) {
                        var opts = editable.data(row);
                        if (_.isArray(opts)) {
                            return opts;
                        } else {
                            return [];
                        }
                    } else if (_.has(editable, 'options')) {
                        return editable.options;
                    }
                }

                return [];
            };

            scope.nullField = function (column, row, elementScope) {
                if (_.has(column.editable, 'nullable') && column.editable.nullable) {
                    scope.updateField(column, row, null, elementScope);
                }
            };

            scope.updateField = function(column, row, data, elementScope) {
                if (_.has(column.editable, 'endpoint')) {
                    scope.updateFieldStatus = {
                        'status': 'saving',
                        'message': 'Saving value for "' + column.title + '"'
                    };
                    var updateMethod = $http[column.editable.endpoint.method];
                    var updateBody = {};
                    updateBody[column.dataField] = data;
                    var updateURL = column.editable.endpoint.url;
                    var foundElements = /\{(\w+)\}/.exec(updateURL);

                    while (foundElements) {
                        updateURL = updateURL.replace(foundElements[0], row[foundElements[1]]);
                        foundElements = /\{(\w+)\}/.exec(updateURL);
                    }

                    if ((!_.isEmpty(elementScope)) && (!_.isEmpty(elementScope.$form))) {
                        elementScope.$form.$hide();
                    }

                    // Now we are going to check to see if there is a
                    // pre-update callback that needs to happen.
                    if (_.has(column.editable, 'preUpdate') && _.isFunction(column.editable.preUpdate)) {
                        // This will stop updating with a false value returned
                        // from the preUpdate function.
                        if (!column.editable.preUpdate(column, row, data)) {
                            scope.updateFieldStatus = {
                                'status': 'error',
                                'message': 'There was an error running the pre update method and the data was not saved.'
                            };

                            $timeout(function () {
                                scope.updateFieldStatus = undefined;
                            }, 3000);

                            return;
                        }
                    }

                    // We'll run the method
                    updateMethod(updateURL, updateBody).then(function () {
                        scope.updateFieldStatus = {
                            'status': 'success',
                            'message': 'Saved data for "' + column.title + '" field'
                        };
                        row[column.dataField] = _.clone(data);

                        // Now we are going to check to see if there is a
                        // post-update-success callback that needs to happen.
                        if (_.has(column.editable, 'postUpdateSuccess') && _.isFunction(column.editable.postUpdateSuccess)) {
                            column.editable.postUpdateSuccess(column, row, data);
                        }

                        return true;
                    }, function (data) {
                        var errorData;
                        try {
                            errorData = JSON.parse(data);
                        } catch (err) {}

                        var errorMessage = 'Error saving data for "' + column.title + '" field';

                        if (_.has(errorData, 'error')) {
                            errorMessage.message += '\n' + errorData.error.message;
                        }

                        scope.$emit('data-table-error', errorMessage);

                        // Now we are going to check to see if there is a
                        // post-update-error callback that needs to happen.
                        if (_.has(column.editable, 'postUpdateError') && _.isFunction(column.editable.postUpdateError)) {
                            column.editable.postUpdateError(column, row, data);
                        }

                        return false;
                    }).then(function () {
                        $timeout(function () {
                            scope.updateFieldStatus = undefined;
                        }, 3000);

                        return true;
                    });

                    // We're returning false so that we are manually updating
                    // the method on success
                    return false;
                } else {
                    return false;
                }
            };

            scope.$on('data-table-error', function ($event, errorString, errorDisplayTimeout) {
                if (_.isEmpty(errorDisplayTimeout)) {
                    errorDisplayTimeout = 3000;
                }

                scope.updateFieldStatus = {
                    'status': 'error',
                    'message': errorString
                };

                $timeout(function () {
                    scope.updateFieldStatus = undefined;
                }, errorDisplayTimeout);
            });

            scope.iconUnwrap = function (column, row, type) {
                return _.filter(column.icon, function (icon) {
                    if (_.has(icon, 'fieldValue') && (icon.fieldValue === this.row[icon.field])) {
                        return true;
                    } else if (row[icon.field] === true) {
                        return true;
                    }
                }, {row: row}).filter(function (icon) {
                    if ((_.has(icon, 'name') && (this.type === 'i'))||(_.has(icon, 'class') && (this.type === 'div'))) {
                        return true;
                    }
                }, {type: type});
            };

            scope.rowClass = function (row) {
                if (!_.isEmpty(scope.rowStyle)) {
                    if (!_.has(scope, 'rowStyleObject')) {
                        scope.rowStyleObject = eval('(' + scope.rowStyle + ')');
                    }

                    if (scope.rowStyleObject.bool) {
                        if (row[scope.rowStyleObject.field]) {
                            return scope.rowStyleObject.class;
                        }
                    } else {
                        var fClass = row[scope.rowStyleObject.field];
                        fClass = (isNaN(parseInt(fClass.toString().charAt(0), 10))) ? fClass : '_'+fClass.toString();
                        return scope.rowStyleObject.class + ' '+ fClass;
                    }
                }
            };

            scope.checkAll = function () {
                var chx = document.querySelectorAll('div.data-table input[type="checkbox"]');
                var chk = document.querySelector('div.data-table input[type="checkbox"]#check_all_checkbox');
                _.forEach(chx, function(check) {
                    if (check.checked !== this.checked) {
                        angular.element(check).triggerHandler('click');
                    }
                }, chk);
            };

            scope.hasValue = function(row, column) {
                return (_.has(row, column.dataField) && !_.isEmpty(row, column.dataField));
            };

            scope.getColumnValue = function (column, row) {
                var columnValue = '';

                var field = (_.has(column, 'displayField') && _.has(row, column.displayField)) ? column.displayField : column.dataField;

                if (_.has(row, field)) {
                    if (_.has(column, 'filter')) {
                        columnValue = $filter(column.filter)(row[field]);
                    } else {
                        columnValue = row[field];
                    }
                }

                return ((_.isEmpty(columnValue)) && (_.has(column, 'emptyValue'))) ? column.emptyValue : columnValue;
            };

            scope.clickAction = function (chkBoxKey) {
                var chkBoxId = 'checkbox_' + chkBoxKey;

                var chkBox = document.querySelector('input[type="checkbox"]#' + chkBoxId);
                if (scope.checkboxEvent) {
                    return scope.checkboxEvent(chkBoxKey, chkBox, chkBox.checked);
                }
            };

            scope.decompilePredicateString = function (pred) {
                if (_.isObject(pred)) {
                    return pred;
                }
                if (_.isEmpty(pred)) {
                    return scope.decompilePredicateString(scope.getDefaultPredicate());
                }

                var rev = false;
                
                if (_.isArray(pred)) {
                    pred = (pred.length === 1) && pred[0] || 'emptysort';
                }
                
                if (pred.substr(0,1) === '-') {
                    pred = pred.substr(1);
                    rev = true;
                }

                return {'column': pred, 'reverse': rev};
            };

            scope.getPresetConfiguration = function () {
                // This is here to make sure that there is a value specified in
                // the columnDisplay.index binding. This is used throughout the
                // application and just ensures that things don't go insane.
                if (!_.isNumber(scope.columnDisplay.index)) {
                    scope.columnDisplay.index = 0;
                }

                if (!scope.isPresetCustom()) {
                    scope.columnDisplay.config = _.clone(scope.getColumnPresets()[scope.columnDisplay.index].config);
                }
                return scope.columnDisplay.config;
            };

            scope.getConfig = function () {
                var visibleColumns = [];

                _.forEach(scope.getPresetConfiguration(), function (columnIndex) {
                    this.visibleColumns.push(this.columns[columnIndex]);
                }, {visibleColumns: visibleColumns, columns: scope.columnConfiguration});

                return visibleColumns;
            };

            scope.getColumnPresets = function () {
                // This is to make sure that when I call columnPresets that it
                // actually has something there.
                if (_.isEmpty(scope.columnPresets)) {
                    scope.columnPresets = [];
                }

                return scope.columnPresets;
            };

            scope.markPresetAsCustom = function () {
                var presets = scope.getColumnPresets();
                if (!_.find(presets, {'title': 'User Preset'})) {
                    presets.push({
                        'title': 'User Preset',
                        'config': _.clone(scope.columnDisplay.config)
                    });
                } else {
                    presets[presets.length - 1].config = _.clone(scope.columnDisplay.config);
                }

                if (_.isNumber(scope.columnDisplay.index)) {
                    scope.columnDisplay.index = presets.length - 1;
                }
            };

            scope.getColumnPresetSelects = function () {
                return _.map(scope.getColumnPresets(), function (preset, index) {
                    return {'text': preset.title, 'value': index};
                });
            };

            scope.isPresetCustom = function () {
                return (scope.getColumnPresets()[scope.columnDisplay.index].title == 'User Preset');
            };

            scope.moveColumn = function(currentIndex, destinationIndex) {
                if (!scope.isPresetCustom()) {
                    scope.markPresetAsCustom();
                }

                var columnToMove = scope.columnDisplay.config.splice(currentIndex, 1)[0];
                scope.columnDisplay.config.splice(destinationIndex, 0, columnToMove);
            };

            scope.moveColumnUp = function (columnIndex) {
                if (columnIndex > 0) {
                    scope.moveColumn(columnIndex, columnIndex - 1);
                }
            };

            scope.moveColumnDown = function (columnIndex) {
                if (columnIndex < scope.columnDisplay.config.length - 1) {
                    scope.moveColumn(columnIndex, columnIndex + 1);
                }
            };

            scope.removeColumn = function (columnIndex) {
                if (!scope.isPresetCustom()) {
                    scope.markPresetAsCustom();
                }

                scope.columnDisplay.config.splice(columnIndex, 1);
            };

            scope.showColumn = function (columnIndex) {
                if (!scope.isPresetCustom()) {
                    scope.markPresetAsCustom();
                }

                if (!_.contains(scope.columnDisplay.config, columnIndex)) {
                    scope.columnDisplay.config.push(columnIndex);
                }
            };

            scope.getAvailableColumns = function () {
                var columnSelects = [];
                _.forEach(scope.columnConfiguration, function (column, index) {
                    this.push({'value': index, 'text': column.title});
                }, columnSelects);

                return _.filter(columnSelects, function (column) {
                    return (!_.contains(this, column.value));
                }, scope.columnDisplay.config);
            };

            scope.findColumnFromPredicate = function (pred) {
                var column = _.find(scope.getConfig(), function (column) {
                    return (this.pred == this.getSortField(column));
                }, {pred: pred, getSortField: scope.getSortField});

                return column || {};
            };

            scope.parseReverseSort = function (column, rev) {
                if (_.isObject(column)) {
                    return (column.sortReverse) ? !rev : rev;
                } else {
                    return scope.parseReverseSort(scope.findColumnFromPredicate(column), rev);
                }
            };

            scope.compilePredicateString = function (column, rev, fromSortField) {
                var pred = (fromSortField) ? column : scope.getSortField(column);
                return ((scope.parseReverseSort(column, rev)) ? '-' : '') + pred;
            };

            scope.singleColumnSort = function(column) {
                scope.pager.pageNumber = 0;

                if (scope.sortedBy(column)) {
                    scope.predicate = [scope.compilePredicateString(column, true)];
                } else {
                    scope.predicate = [scope.compilePredicateString(column)];
                }
                
                angular.element(document).data('sortingData', scope.predicate);
            };

            scope.addColumnSort = function (column) {
                var sortIndex = scope.getSortedIndex(column);

                if (sortIndex === -1) {
                    sortIndex = scope.getSortedIndex(column, true);

                    if (sortIndex >= 0) {
                        if (scope.predicate.length > 1) {
                            scope.predicate.splice(sortIndex, 1);
                        } else {
                            scope.predicate[sortIndex] = scope.compilePredicateString(column);
                        }
                    } else {
                        scope.predicate.push(scope.compilePredicateString(column));
                    }
                } else {
                    scope.predicate[sortIndex] = scope.compilePredicateString(column, true);
                }
            };

            scope.sort = function ($event, column) {
                if ($event.shiftKey) {
                    scope.addColumnSort(column);
                } else {
                    scope.singleColumnSort(column);
                }
            };

            scope.getSortedIndex = function (column, inverted) {
                var pred = scope.compilePredicateString(column, inverted);
                return scope.predicate.indexOf(pred);
            };

            scope.sortedBy = function (column, inverted) {
                return (scope.getSortedIndex(column, inverted) >= 0);
            };

            scope.getDefaultPredicate = function () {
                if (!_.isEmpty(scope.defaultSort)) {
                    return eval(scope.defaultSort);
                } else {
                    return [scope.compilePredicateString(scope.getConfig()[0])];
                }
            };

            scope.reversePredicate = function (index) {
                var pred = scope.decompilePredicateString(scope.predicate[index]);
                pred.reverse = scope.parseReverseSort(pred.column, pred.reverse);
                scope.predicate[index] = scope.compilePredicateString(pred.column, !pred.reverse, true);
            };

            scope.updatePredicate = function (index, selectBoxValue) {
                var column = scope.findColumnFromPredicate(selectBoxValue);
                if (!_.isEmpty(column)) {
                    scope.predicate[index] = scope.compilePredicateString(column);
                }
            };

            scope.removePredicate = function (index) {
                if (scope.predicate.length > 1) {
                    scope.predicate.splice(index, 1);
                }
            };

            scope.getSortableColumnSelects = function () {
                var returnSelects = [];

                _.forEach(scope.getConfig(), function (column) {
                    this.retObj.push({'text': column.title, 'value': this.getSortField(column)});
                }, {'retObj': returnSelects, 'getSortField': scope.getSortField});
                
                return _.filter(_.filter(returnSelects, 'text'), 'value');
            };

            scope.toggleVisibility = function (state) {
                if (state !== undefined) {
                    scope.configurationVisible = state;
                } else {
                    scope.configurationVisible = !scope.configurationVisible;
                }
            };

            scope.predicate = scope.getDefaultPredicate();

            // Have to a setTimeout so that it's there.
            setTimeout(function () {
                angular.element(document.querySelector('.data-table-config-container')).on('click', function (e) {
                    e.stopPropagation();
                });
            }, 1);

            $document.on('click', function () {
                this.toggleVisibility(false);
            }.bind(scope));
        }
    };
});

app.filter('UnusedSorts', function() {
    return function(configObject, predicates, currentColumn) {
        return _.filter(configObject, function (column) {
            // This is here to find the sortField value
            var sortField = (column.sortField||(column.sortField !== false)) && column.sortField || column.dataField;
            if (currentColumn == sortField) {
                return true;
            } else {
                return !(_.contains(this.predicate, sortField) || _.contains(this.predicate, '-'+sortField));
            }
        }, {predicate: predicates});

    };
});

app.filter('ColumnValue', function ($filter) {
    return function (row, column, allowEditing) {
        var columnValue = '';
        allowEditing = (_.isUndefined(allowEditing)) ? true : allowEditing;

        var field = (_.has(column, 'displayField') && _.has(row, column.displayField)) ? column.displayField : column.dataField;

        if (_.has(row, field)) {
            if (_.has(column, 'filter')) {
                columnValue = $filter(column.filter)(row[field]);
            } else {
                columnValue = row[field];
            }
        }

        if (allowEditing) {
            columnValue = ((_.isEmpty(columnValue)) && (_.has(column, 'emptyValue'))) ? column.emptyValue : columnValue;
        }

        return columnValue;
    };
});

angular.module('rxDataTable')
/**
 *
 * @ngdoc directive
 * @name rxDataTable.paginate:rxPaginate
 * @restrict E
 * @description
 * Directive that takes in the page tracking object and outputs a page
 * switching controller
 *
 * @param {Object} page-tracking This is the page tracking service instance to
 * be used for this directive
 * @param {number} number-of-pages This is the maximum number of pages that the
 * page object will display at a time.
 */
    .directive('rxDataTablePaginate', function () {
        return {
            templateUrl: 'src/templates/rx-data-table-paginate.html',
            replace: true,
            restrict: 'E',
            scope: {
                pageTracking: '=',
                numberOfPages: '@'
            }
        };
    })
/**
 *
 * @ngdoc service
 * @name rxDataTable.paginate:PageTracking
 * @description
 * This is the data service that can be used in conjunction with the pagination
 * objects to store/control page display of data tables and other items.
 *
 * @property {number} MAX_PER_PAGE This is a value that is used in the
 * iteration function to generate the item size list.
 * @property {number} MIN_PER_PAGE This is a value that is used in the
 * iteration function to generate the item size list.
 * @property {number} ITEMS_PER_PAGE_STEP This is a value that is used in the
 * iteration function to generate the item size list.
 * @property {number} itemsPerPage This is the current setting for the number
 * of items to display per page
 * @property {number} pagesToShow This is the number of pages to show 
 * in the pagination controls
 * @property {Array} itemSizeList This is where the
 * {@link rxDataTable.paginate:rxItemsPerPage rxItemsPerPage}
 * Directive will store it's list of items per page
 * @property {number} pageNumber This is where the current page number is
 * stored.
 * @property {boolean} pageInit This is used to determine if the page has been
 * initialzed before.
 * @property {number} total This is the total number of items that are in the
 * data set
 * @property {boolean} showAll This is used to determine whether or not to use
 * the pagination or not.
 *
 * @method createInstance This is used to generate the instance of the
 * PageTracking object.
 */
    .factory('PageTracking', function() {
        function PageTrackingObject(showAll) {
            this.MAX_PER_PAGE = 50;
            this.MIN_PER_PAGE = 10;
            this.ITEMS_PER_PAGE_STEP = 10;
            this.itemsPerPage = 10;
            this.pagesToShow = 5;
            this.itemSizeList = [];
            this.pageNumber = 0;
            this.pageInit = false;
            this.total = 0;
            this.showAll = (showAll) ? true : false;
        }
      
        return {
            createInstance: function(showAll) {
                return new PageTrackingObject(showAll);
            }
        };
    }).
/**
 *
 * @ngdoc directive
 * @name rxDataTable.paginate:rxItemsPerPage
 * @restrict E
 * @description
 * Directive that takes in a page-tracking object and a label for what to call
 * items and outputs a select box that allows you to change how many items in
 * the list to show at a time
 *
 * @param {Object} pager This is the page tracking service instance to
 * be used for this directive
 * @param {string='Items'} label This is the name of the items that you are
 * restricting. It defaults to 'Items' and thus outputs 'Items per page'
 */
    directive('rxDataTableItemsPerPage', function(PageTracking) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'src/templates/rx-data-table-itemsPerPage.html',
            scope: {
                label: '@',
                pager: '=?'
            },
            link: function(scope) {
                if (_.isUndefined(scope.pager)) {
                    scope.pager = PageTracking.createInstance();
                }

                if (!scope.pager.pageInit) {
                    scope.pager.pageInit = true;
                }
                            
                try {
                    scope.updatePaging = function () {
                        scope.pager.ticketsPerPage = parseInt(scope.pager.ticketsPerPage, 10);
                        scope.pager.pageNumber = 0;
                    }.bind(scope);
                } catch (err) {
                    // This is here because the tests are being weird.
                }

                scope.pager.itemSizeList = _.range(scope.pager.MIN_PER_PAGE,
                    scope.pager.MAX_PER_PAGE + scope.pager.ITEMS_PER_PAGE_STEP,
                    scope.pager.ITEMS_PER_PAGE_STEP);
            }
        };
    })

/**
 *
 * @ngdoc filter
 * @name rxDataTable.paginate:Paginate
 * @description
 * This is the pagination filter that is used to calculate the division in the
 * items list for the paging.
 *
 * @param {Object} items The list of items that are to be sliced into pages
 * @param {Object} pager The instance of the PageTracking service. If not
 * specified, a new one will be created.
 *
 * @returns {Object} The list of items for the current page in the PageTracking object
 */
    .filter('Paginate', function (PageTracking) {
        return function (items, pager) {
            if (!pager) {
                pager = PageTracking.createInstance();
            }
            if (pager.showAll) {
                pager.total = items.length;
                return items;
            }
            if (items) {
                pager.total = items.length;
                pager.totalPages = Math.ceil(pager.total / pager.itemsPerPage);

                var first = pager.pageNumber * pager.itemsPerPage;
                var added = first + pager.itemsPerPage;
                var last = (added > items.length) ? items.length : added;

                pager.first = first + 1;
                pager.last = last;

                return items.slice(first, last);
            }
        };
    })
/**
 *
 * @ngdoc filter
 * @name rxDataTable.paginate:Page
 * @description
 * This is the pagination filter that is used to limit the number of pages
 * shown
 *
 * @param {Object} pager The instance of the PageTracking service. If not
 * specified, a new one will be created.
 *
 * @returns {Array} The list of page numbers that will be displayed.
 */
    .filter('Page', function (PageTracking) {
        return function (pager) {
            if (!pager) {
                pager = PageTracking.createInstance();
            }

            var displayPages = [],
                // the next four variables determine the number of pages to show ahead of and behind the current page
                pagesToShow = pager.pagesToShow || 5,
                pageDelta = (pagesToShow - 1) / 2,
                pagesAhead = Math.ceil(pageDelta),
                pagesBehind = Math.floor(pageDelta);

            if ( pager && pager.length !== 0) {
                    // determine starting page based on (current page - (1/2 of pagesToShow))
                var pageStart = Math.max(Math.min(pager.pageNumber - pagesBehind, pager.totalPages - pagesToShow), 0),

                    // determine ending page based on (current page + (1/2 of pagesToShow))
                    pageEnd = Math.min(Math.max(pager.pageNumber + pagesAhead, pagesToShow - 1), pager.totalPages - 1);

                for (pageStart; pageStart <= pageEnd; pageStart++) {
                    // create array of page indexes
                    displayPages.push(pageStart);
                }
            }

            return displayPages;
        };

    });

angular.module('rxDataTable').run(['$templateCache', function ($templateCache) {
	$templateCache.put('src/templates/rx-data-table-itemsPerPage.html', '<form id="itemsPerPageForm" class="itemsPerPage"> <label for="itemsPerPageSelector">{{ label }}</label> <select name="itemsPerPageSelector" id="itemsPerPageSelector" ng-model="pager.itemsPerPage" ng-change="updatePaging()"> <option ng-repeat="i in pager.itemSizeList">{{ i }}</option> </select> </form> ');
	$templateCache.put('src/templates/rx-data-table-paginate.html', '<ul class="pagination"> <li ng-class="{disabled: pageTracking.pageNumber==0}" class="pagination-first"> <a ng-click="pageTracking.pageNumber=0" ng-hide="pageTracking.pageNumber==0">First</a> <span ng-show="pageTracking.pageNumber==0">First</span> </li> <li ng-class="{disabled: pageTracking.pageNumber==0}" class="pagination-prev"> <a ng-click="pageTracking.pageNumber=(pageTracking.pageNumber - 1)" ng-hide="pageTracking.pageNumber==0">« Prev</a> <span ng-show="pageTracking.pageNumber==0">« Prev</span> </li> <li ng-repeat="n in pageTracking | Page " ng-class="{active: n==pageTracking.pageNumber, \'page-number-last\': n==pageTracking.totalPages - 1}" class="pagination-page"> <a ng-click="pageTracking.pageNumber=n">{{n + 1}}</a> </li> <li ng-class="{disabled: pageTracking.pageNumber==pageTracking.totalPages - 1 || pageTracking.total==0}" class="pagination-next"> <a ng-click="pageTracking.pageNumber=(pageTracking.pageNumber + 1)" ng-hide="pageTracking.pageNumber==pageTracking.totalPages - 1 || pageTracking.total==0"> Next »</a> <span ng-show="pageTracking.pageNumber==pageTracking.totalPages - 1">Next »</span> </li> <li ng-class="{disabled: pageTracking.pageNumber==pageTracking.totalPages - 1}" class="pagination-last"> <a ng-click="pageTracking.pageNumber=pageTracking.totalPages - 1" ng-hide="pageTracking.pageNumber==pageTracking.totalPages - 1">Last</a> <span ng-show="pageTracking.pageNumber==pageTracking.totalPages - 1">Last</span> </li> </ul> ');
	$templateCache.put('src/templates/rx-data-table.html', '<div class="data-table"> <div class=\'alert\' ng-show="updateFieldStatus" ng-class="{\'loading\': updateFieldStatus.status==\'saving\', \'success\': updateFieldStatus.status==\'success\', \'error\': updateFieldStatus.status==\'error\'}"> {{ updateFieldStatus.message }} </div> <div class="data-info-row"> <strong ng-if="!pager.showAll">{{pager.first}} - {{pager.last}} of <span class=\'total-data-items\'>{{pager.total}} {{ itemName && itemName || \'Items\' }}</span></strong> <strong ng-if="pager.showAll">{{ (listOfData().length> 0) && 1 || 0 }} - {{ listOfData().length }} of {{ listOfData().length }}</strong> <div class="data-table-config-container" ng-if="enableColumnReordering||enableColumnMultiSort" ng-class="{\'dropdown-shown\': configurationVisible}"> <button class="btn-link" ng-click="toggleVisibility()"> <i class="fa fa-table data-table-config-icon" title="Configure Data Table"></i> </button> <div class="data-table-config reveal-animation" ng-show="configurationVisible"> <div class="header" ng-if="enableColumnMultiSort">Sorting</div> <div class="data-table-multi-sort" ng-if="enableColumnMultiSort"> <div class="data-config-row"> <div class="multi-sort-select header">Column</div> <div class="multi-sort-reverse-icon header">Dir</div> <div class="multi-sort-remove-icon header"><span ng-show="predicate.length> 1">Rem</span></div> </div> <div class="data-config-row" ng-repeat="pred in predicate" ng-init="predColumn=decompilePredicateString(pred)"> <div class="multi-sort-select"> <select name="sort-{{$index}}" ng-model="predColumn.column" ng-change="updatePredicate($index, predColumn.column)"> <option ng-repeat="column in getConfig() | UnusedSorts:predicate:predColumn.column" value="{{ getSortField(column) }}" ng-selected="getSortField(column)==predColumn.column">{{ column.title }}</option> </select> </div> <button class="btn-link multi-sort-reverse-icon" ng-click="reversePredicate($index)"> <i class="fa" ng-class="{\'fa-sort-amount-asc\': !parseReverseSort(predColumn.column, predColumn.reverse), \'fa-sort-amount-desc\': parseReverseSort(predColumn.column, predColumn.reverse)}"></i> </button> <div class="multi-sort-remove-icon"> <button class="btn-link" ng-click="removePredicate($index)"> <i class="fa fa-times" ng-if="predicate.length> 1"></i> </button> </div> </div> <button class="btn-link multi-sort-add" ng-if="(predicate.length <configObject.length) && (predicate[predicate.length-1].length> 0)" ng-click="predicate.push(\'\')"> Add New Sort </button> </div> <div class="header" ng-if="enableColumnReordering">Column Configuration</div> <div class="data-table-column-display" ng-if="enableColumnReordering"> <div class="data-config-row"> <div class="header">Column Presets</div> </div> <div class="data-config-row column-preset-row"> <select ng-options="preset.value as preset.text for preset in getColumnPresetSelects()" ng-model="columnDisplay.index"></select> </div> <div class="data-config-row"> <div class="header">Column Order</div> </div> <div class="data-config-row" ng-repeat="column in getConfig()"> <div class="data-config-column-title"> {{ column.title }} </div> <div class="column-order-arrows"> <button class="btn-link btn-move-down" ng-if="!$last" ng-click="moveColumnDown($index)"> <i class="fa fa-arrow-down"></i> </button> <button class="btn-link btn-move-up" ng-if="!$first" ng-click="moveColumnUp($index)"> <i class="fa fa-arrow-up"></i> </button> </div> <div class="column-hide-display"> <button class="btn-link" ng-click="removeColumn($index)"> <i class="fa fa-times"></i> </button> </div> </div> <div class="data-config-row" ng-if="getAvailableColumns().length> 0"> <div class="header">Available Columns</div> </div> <div class="data-config-row column-show-columns" ng-if="getAvailableColumns().length> 0"> <select ng-model="addColumn.index" ng-options="column.value as column.text for column in getAvailableColumns()"> </select> <button ng-click="showColumn(addColumn.index)" class="button button-tiny">add</button> </div> </div> </div> </div> </div> <div class="data-header"> <div class="data-header-cell data-column-{{ $index + 1 }} flex-columns-{{ column.cols }}" ng-repeat="column in getConfig()" data-title="{{ column.title && column.title || column.dataField }}"> <span class="checkbox-span" ng-if="column.checkbox && column.checkAll"> <input ng-click="checkAll(this)" type="checkbox" id="check_all_checkbox"> </span> <button ng-if="!column.checkbox" ng-click="sort($event, column)" class="btn-link data-link">{{ column.title }} <i ng-if="column.help" class="fa fa-question-circle" data-popover="{{ column.help.body }}" data-popover-title="{{ column.help.title }}" data-trigger="focus"></i> <i class="fa fa-chevron-down" ng-show="sortedBy(column, true)"></i> <i class="fa fa-chevron-up" ng-show="sortedBy(column)"></i> </button> </div> </div> <div class="data-row data-row-{{ $index + 1}}" ng-repeat="row in listOfData() | orderBy:predicate | Paginate: pager track by row[rowKey]" data-row-key="{{row[rowKey]}}" ng-class="rowClass(row)"> <div class="data-cell flex-columns-{{ column.cols }} data-column-{{ $index + 1}} {{ column.class }}" ng-repeat="column in getConfig()" data-title="{{ column.title }}" ng-class="getNGClass(column, row)"> <div ng-if="column.checkbox" class="checkbox"> <input type="checkbox" value="{{ row[column.dataField] }}" ng-click="clickAction(\'{{ row[column.dataField] }}\')" id="checkbox_{{ row[column.dataField] }}"> </div> <div ng-if="!column.checkbox"> <i ng-repeat="icon in iconUnwrap(column, row, \'i\')" class="data-table-cell-icon {{ icon.name }}"></i> <div ng-repeat="icon in iconUnwrap(column, row, \'div\')" class="data-table-cell-icon {{ icon.class }}" alt="{{ icon.alt }}"></div> <a ng-if="column.linkField && hasValue(row, column)" href="{{ row[column.linkField] }}" class="data-cell-content" target="_blank">{{ row | ColumnValue:column }}</a> <span ng-if="!column.linkField && hasValue(row, column)" class="data-cell-content"> <span ng-if="!allowEditing(column,row)">{{ row | ColumnValue:column:false }}</span> <span ng-if="allowEditing(column,row)" class="data-editable"> <span ng-switch="getEditType(column, row)"> <span ng-switch-when="select" class="data-editable-field" editable-select="row[column.dataField]" e-ng-options="o.value as o.text for o in getEditableOptions(column, row)" buttons="no" onbeforesave="updateField(column, row, $data, this)">{{ row | ColumnValue:column }}</span> <span ng-switch-when="typeahead" class="data-editable-field" editable-text="row[column.dataField]" e-typeahead="o.value as o.text for o in getEditableOptions(column, row) | filter:$viewValue" e-typeahead-loading="loadingData" e-typeahead-on-select="updateField(column, row, $data, this)" buttons="no" onshow="getEditableOptions(column, row)">{{ row | ColumnValue:column }}</span> <span ng-switch-default class="data-editable-field" editable-text="row[column.dataField]" onbeforesave="updateField(column, row, $data, this)">{{ row | ColumnValue:column }}</span> <i class="fa fa-refresh data-table-type-loader" ng-show="loadingData"></i> <button class="data-table-field-nullable btn-link" ng-if="column.editable.nullable" ng-click="nullField(column, row, this)" title="Remove {{ column.title }} Value"> <i class="fa fa-times fa-lg"></i> </button> </span> </span> </span> </div> </div> </div> <div ng-if="!pager.showAll" class="pagination-container" ng-show="pager.total> 0"> <rx-data-table-paginate page-tracking="pager"/> </div> <div ng-if="!pager.showAll" class="items-per-page-container" ng-show="pager.total> 0"> <rx-data-table-items-per-page pager="pager" label="{{ itemName && itemName || \'Items\'}} Per Page"/></rx-data-table-items-per-page> </div> </div> ');
}]);