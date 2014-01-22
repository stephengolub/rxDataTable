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
 * @param {expression=} visibility If the expression is
 *                      truthy, then the table is shown or hidden respectively
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
app.directive('rxDataTable', function ($http, $timeout, $document, $filter) {
    return {
        restrict: 'E',
        templateUrl: 'src/templates/rx-data-table.html',
        replace: true,
        scope: {
            visibility: '@',
            pager: '=',
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

                    // We'll run the method
                    updateMethod(updateURL, updateBody).then(function () {
                        scope.updateFieldStatus = {
                            'status': 'success',
                            'message': 'Saved data for "' + column.title + '" field'
                        };
                        row[column.dataField] = _.clone(data);

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
