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
 * @param {Object=} pager-object This is the page tracking object for the directive. If
 * no page tracking object is passed in, then the data table will be shown
 * without pagination.
 * @param {Array.<Object>} list-of-data This is the list of data that the data table will represent 
 * @param {Array.string=|string=|boolean=} predicate This is the sort predicate. This should be an
 *      array of strings that will be used as sort predicates. (i.e. **`"['-severity']"`**). 
 *      You may also pass a value of **`false`** in order to disable sorting on
 *      all columns that don't have a sortField value explicitely defined.
 * @param {string=} row-key This is the attribute of the data objects that will
 *                       be used to attatch a data-value-key paramater to each
 *                       row of the table
 * @param {function=} row-details Setting this attribute to a function will add
 *      a toggle to the end of the right side of the table on each row that
 *      will insert and fill in the result of this function onto the table.
 * @param {expression=} row-details-clause If this attribute is set, it will be
 *      evaluated for every row, and if true, will only apply the row details
 *      function to those rows.
 * @param {string='Items'} item-name This is what the data table will fill in
 *                      to indicate what the items in it really are.
 * @param {number=} notify-duration This is a default notification duration in
 *      milliseconds. This value is 3000 by default.
 * @param {boolean=} data-loading This is a flag that should be passed to the
 *      data table to indicate loading status.
 * @param {string=} row-style This is an object in a string format that is parsed
 *    in the code and applied to each row in the table.
 *
 *    It takes three attributes:
 *
 *    - **`class`** `{string}`: This is the class that gets to the row.
 *    - **`field`** `{string}`: This is the data field that the comparisons will be made against.
 *    - **`bool`** `{boolean}`: If true, then it just checks the field to see if it's truthy and applies the class. If it's false (default), then the value of the field is applied as a class along with the value in the class attribute. To account for non-string data values in the field, this will check to see if the first character in the field value is numerical, if it is, it prepends the value with an underscore (\_).  So, for example, if you have your class as data-service-level and the field value turns out to be a 2, then the class attribute of the row will be **`class="data-service-level _2"`**. This allows you to grab that row with **`.data-service-level._2`** and apply CSS values to it.
 *                              
 o @param {Object} column-display This object will hold the current display
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
app.directive('rxDataTable', function ($http, $timeout, $document, $filter, $parse, PageTracking) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'src/templates/rx-data-table.html',
        scope: {
            pagerObject: '=?',
            loadingData: '&',
            columnConfiguration: '=',
            columnDisplay: '=?',
            columnPresets: '=?',
            rowKey: '@',
            rowStyle: '&',
            itemName: '@',
            listOfData: '&',
            predicate: '=?',
            columnMultiSort: '@',
            notifyDuration: '@',
            columnReordering: '@',
            rowDetails: '&',
            rowDetailsClause: '@'
        },
        link: function (scope, element) {
            /* jshint evil: true */
            scope.configurationVisible = false;
            scope.enableColumnMultiSort = (!_.isEmpty(scope.columnMultiSort)) ? scope.columnMultiSort : false;
            scope.enableColumnReordering = (!_.isEmpty(scope.columnReordering)) ? scope.columnReordering : false;

            scope.defaultNotificationDuration = (_.isUndefined(scope.notifyDuration)) ? 3000 : parseInt(scope.notifyDuration, 10);

            scope.isLoading = scope.loadingData;

            if (_.isUndefined(scope.pagerObject)) {
                scope.pagerObject = PageTracking.createInstance();
                scope.pagerObject.showAll = true;
            }

            if (_.isUndefined(scope.columnPresets)) {
                // There aren't any presets defined, so we are going to create
                // a basic default view
                scope.columnPresets = [
                    {
                        'title': 'Default View',
                        'config': []
                    }
                ];

                _.forEach(scope.columnConfiguration, function (column, index) {
                    this.columnPresets[0].config.push(index);
                }, scope);
            }

            if (_.isUndefined(scope.columnDisplay)) {
                scope.columnDisplay = {index: 0};
            }

            scope.showRowDetails = (!_.isUndefined(scope.rowDetails) && _.isFunction(scope.rowDetails()));
            scope.canExpandRow = function (row) {
                if (scope.showRowDetails && !_.isEmpty(scope.rowDetailsClause)) {
                    return $parse(scope.rowDetailsClause)(row);
                }

                return scope.showRowDetails;
            };
            scope.currentRow = '';

            scope.toggleRow = function (key) {
                var dataTable = element[0];
                var row = dataTable.querySelector('.data-row[data-row-key="' + key + '"]');
                var detailsDiv;

                if (scope.currentRow !== '') {
                    detailsDiv = dataTable.querySelector('.data-row-details[data-row-key="' + scope.currentRow + '"]');
                    dataTable.removeChild(detailsDiv);
                } else {
                    detailsDiv = document.createElement('div');
                    detailsDiv.classList.add('data-row-details');
                }

                detailsDiv.innerHTML = '';

                if (scope.currentRow === key) {
                    scope.currentRow = '';
                } else {
                    detailsDiv.setAttribute('data-row-key', key);
                    scope.currentRow = key;
                    var rowDetailsFunction = scope.rowDetails();
                    var rowDetailsElement = rowDetailsFunction(key);

                    angular.element(detailsDiv).append(rowDetailsElement);

                    angular.element(row).after(detailsDiv);
                }
            };

            if (scope.showRowDetails) {
                scope.$watch('pagerObject', function () {
                    if (scope.currentRow !== '') {
                        setTimeout(function () {
                            var detailsDiv = element[0].querySelector(
                                '.data-row-details[data-row-key="' + scope.currentRow + '"]');

                            if (!detailsDiv) {
                                scope.currentRow = '';
                            }
                        }, 100);
                    }

                }, true);
            }

            scope.buildContent = function (row, column) {
                if (_.has(column, 'contentFunction')) {
                    return _.memoize(column.contentFunction)(row);
                }
            };

            scope.buildLink = function (row, column) {
                if (_.has(column, 'linkField') && _.has(row, column.linkField)) {
                    return row[column.linkField];
                } else if (_.has(column, 'linkFunction') && _.isFunction(column.linkFunction)) {
                    return column.linkFunction(row);
                }
            };

            scope.getPredicate = function () {
                if (scope.predicate === false) {
                    // This means we're going to be disabling sorting on all
                    // columns unless they have an explicit sort field
                    scope.disableSorting = true;
                    return [];
                } else if (!_.isArray(scope.predicate)) {
                    scope.predicate = [scope.compilePredicateString(scope.getConfig()[0])];
                }

                return scope.predicate;
            };

            scope.canAddNewMultiSort = function () {
                var pred = scope.getPredicate();

                if (_.isEmpty(_.last(pred))) {
                    return false;
                } else {
                    return (pred.length < scope.columnConfiguration.length);
                }
            };
            scope.getSortField = function (column) {
                if (_.isObject(column)) {
                    return (column.sortField||(column.sortField !== false)) && column.sortField || column.dataField;
                }
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

                var sortClass = scope.sortClass(column);

                if (!_.isEmpty(sortClass)) {
                    classes[sortClass] = true;
                }

                if (_.has(column, 'ng-class') && _.isFunction(column['ng-class'])) {
                    var classFunction = column['ng-class'];
                    var classValue = classFunction(row);

                    if (!_.isEmpty(classValue)) {
                        classes[classValue] = true;
                    }
                } else if (_.has(column, 'ng-class') && _.isObject(column['ng-class'])) {
                    classes = angular.extend(classes, column['ng-class']);
                }

                return classes;
            };

            scope.getEditableOptions = function (column, row, typedValue) {
                if (_.has(column, 'editable')) {
                    var editable = column.editable;
                    if (_.has(editable, 'data')) {
                        var opts = editable.data(row, typedValue);
                        if (_.isObject(opts)) {
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

            scope.showStatusMessage = function(type, message, duration) {
                if (_.isUndefined(duration)) {
                    duration = scope.defaultNotificationDuration;
                }

                scope.updateFieldStatus = {
                    'status': type,
                    'message': message
                };

                if (_.isNumber(duration)) {
                    $timeout(scope.clearStatusMessage.bind(scope), duration);
                }
            };

            scope.clearStatusMessage = function() {
                scope.updateFieldStatus = undefined;
            };

            scope.updateField = function(column, row, data) {
                if (!_.has(column.editable, 'endpoint')) {
                    // First we're going to see if the user has provided a
                    // custom update method to us instead
                    if (_.has(column.editable, 'method')) {
                        return column.editable.method(column, row, data);
                    } else {
                        return false;
                    }
                }
                scope.showStatusMessage('saving', 'Saving value for "' + column.title + '"', false);

                var updateMethod = $http[column.editable.endpoint.method];
                var updateBody = {};
                updateBody[column.dataField] = data;
                var updateURL = column.editable.endpoint.url;
                var foundElements = /\{(\w+)\}/.exec(updateURL);

                while (foundElements) {
                    updateURL = updateURL.replace(foundElements[0], row[foundElements[1]]);
                    foundElements = /\{(\w+)\}/.exec(updateURL);
                }

                // Now we are going to check to see if there is a
                // pre-update callback that needs to happen.
                if (_.has(column.editable, 'preUpdate') && _.isFunction(column.editable.preUpdate)) {
                    // This will stop updating with a false value returned
                    // from the preUpdate function.
                    if (!column.editable.preUpdate(column, row, data)) {
                        scope.showStatusMessage('error', 'There was an error running the pre update method and the data was not saved.');

                        return;
                    }
                }

                // We'll run the method
                return updateMethod(updateURL, updateBody).then(function () {
                    scope.showStatusMessage('success', 'Saved data for "' + column.title + '" field');
                    row[column.dataField] = _.clone(data);

                    // Now we are going to check to see if there is a
                    // post-update-success callback that needs to happen.
                    if (_.has(column.editable, 'postUpdateSuccess') && _.isFunction(column.editable.postUpdateSuccess)) {
                        column.editable.postUpdateSuccess(column, row, data);
                    }

                    return true;
                }, function (responseData) {
                    var errorMessage = 'Error saving data for "' + column.title + '" field';

                    if (_.has(responseData.data, 'error')) {
                        errorMessage += '\n' + responseData.data.error;
                    }

                    scope.$emit('data-table-error', errorMessage);

                    // Now we are going to check to see if there is a
                    // post-update-error callback that needs to happen.
                    if (_.has(column.editable, 'postUpdateError') && _.isFunction(column.editable.postUpdateError)) {
                        column.editable.postUpdateError(column, row, responseData);
                    }

                    return false;
                }).then(function () {
                    $timeout(scope.clearStatusMessage.bind(scope), scope.defaultNotificationDuration);

                    return true;
                });
            };

            scope.$on('data-table-error', function ($event, errorString, errorDisplayTimeout) {
                if (!_.isNumber(errorDisplayTimeout)) {
                    errorDisplayTimeout = scope.defaultNotificationDuration;
                }

                scope.showStatusMessage('error', errorString, errorDisplayTimeout);

                $timeout(function () {
                    scope.updateFieldStatus = undefined;
                }, errorDisplayTimeout);
            });

            scope.iconUnwrap = function (column, row, type) {
                return _.filter(column.icon, function (icon) {
                    if (_.has(icon, 'fieldValue')) {
                        if (_.isArray(this.row[icon.field]) && _.contains(this.row[icon.field], icon.fieldValue)) {
                            return true;
                        } else if (icon.fieldValue === this.row[icon.field]) {
                            return true;
                        }
                    } else if (row[icon.field] === true) {
                        return true;
                    } else if (_.has(icon, 'fieldMinLength') && _.isArray(row[icon.field])) {
                        return row[icon.field].length >= icon.fieldMinLength;
                    }
                }, {row: row}).filter(function (icon) {
                    if ((_.has(icon, 'name') && (this.type === 'i'))||(_.has(icon, 'class') && (this.type === 'div'))) {
                        return true;
                    }
                }, {type: type});
            };

            scope.rowClass = function (row) {
                if (!_.isUndefined(scope.rowStyle) &&  _.isFunction(scope.rowStyle())) {
                    return scope.rowStyle()(row);
                }
            };

            scope.hasValue = function(row, column) {
                if (_.isArray(column.dataField)) {
                    return _.any(column.dataField, function (fieldName) {
                        return (_.has(this, fieldName) && !_.isEmpty(this, fieldName));
                    }, row);
                } else {
                    return (_.has(row, column.dataField) && !_.isEmpty(row, column.dataField));
                }
            };

            scope.decompilePredicateString = function (pred) {
                if (_.isArray(pred)) {
                    return pred;
                }

                var rev = false;
                
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
                        'config': scope.columnDisplay.config
                    });
                } else {
                    presets[presets.length - 1].config = scope.columnDisplay.config;
                }

                if (_.isNumber(scope.columnDisplay.index)) {
                    scope.columnDisplay.index = presets.length - 1;
                }
            };

            scope.getColumnPresetSelects = _.memoize(function () {
                return _.map(scope.getColumnPresets(), function (preset, index) {
                    return {'text': preset.title, 'value': index};
                });
            }, function () {
                return _.template('<%=length%>|<%=indices%>', {
                    length: scope.getColumnPresets().length,
                    indices: _.last(scope.getColumnPresets()).config
                });
            });

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
                return _.filter(scope.columnConfiguration, function (column) {
                    return (!_.contains(scope.columnDisplay.config, column.id));
                });
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
                scope.pagerObject.pageNumber = 0;

                if (scope.sortedBy(column)) {
                    scope.predicate = [scope.compilePredicateString(column, true)];
                } else {
                    scope.predicate = [scope.compilePredicateString(column)];
                }
                
                angular.element(document).data('sortingData', scope.getPredicate());
            };

            scope.addColumnSort = function (column) {
                var sortIndex = scope.getSortedIndex(column);

                if (sortIndex === -1) {
                    sortIndex = scope.getSortedIndex(column, true);

                    if (sortIndex >= 0) {
                        if (scope.getPredicate().length > 1) {
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

            scope.sortable = function (column) {
                if (_.isObject(column)) {
                    if (scope.disableSorting && _.has(column, 'sortField')) {
                        return true;
                    } else if (scope.disableSorting || column.sortField === false) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            };

            scope.sort = function ($event, column) {
                if (scope.sortable(column)) {
                    if ($event.shiftKey) {
                        scope.addColumnSort(column);
                    } else {
                        scope.singleColumnSort(column);
                    }
                }
            };

            scope.sortClass = function (column) {
                var index = scope.getSortedIndex(column);
                if (index === -1) {
                    index = scope.getSortedIndex(column, true);
                }

                if (index >= 0) {
                    return 'sorted-' + index + '-' + ((scope.sortedBy(column)) ? 'asc' : 'desc');
                }
            };

            scope.getSortedIndex = function (column, inverted) {
                var pred = scope.compilePredicateString(column, inverted);
                return scope.getPredicate().indexOf(pred);
            };

            scope.isOverflowActive = function (dataCell) {
                return (dataCell.offsetWidth < dataCell.scrollWidth);
            };

            scope.hoverTimeouts = {};
            scope.cellMouseEnter = function (enterEvent) {
                var dataCell = enterEvent.target;
                var dataKey = dataCell.parentElement.className + dataCell.className;
                var dataCellContent = dataCell.querySelector('.data-cell-content');

                if (_.has(scope.hoverTimeouts, dataKey)) {
                    $timeout.cancel(scope.hoverTimeouts[dataKey]);
                }

                scope.hoverTimeouts[dataKey] = $timeout(function () {
                    if (!_.isEmpty(dataCellContent) && scope.isOverflowActive(dataCellContent)) {
                        // Overflow is active for this cell, let's allow it to grow
                        var widthDelta = dataCellContent.scrollWidth - dataCellContent.offsetWidth;
                        var heightDelta = dataCellContent.scrollHeight - dataCellContent.offsetHeight;

                        var newCell = dataCell.cloneNode(true);
                        newCell.classList.add('overflow-hover');

                        newCell.style.top = dataCell.offsetTop + 'px';
                        newCell.style.left = dataCell.offsetLeft + 'px';

                        newCell.style.width = dataCell.offsetWidth + 'px';
                        newCell.style.height = dataCell.offsetHeight + 'px';

                        $timeout(function () {
                            newCell.style.top = (dataCell.offsetTop - (heightDelta / 2)) + 'px';
                            newCell.style.left = (dataCell.offsetLeft - (widthDelta / 2)) + 'px';
                            newCell.style.width = (dataCell.offsetWidth + widthDelta) + 'px';
                            newCell.style.height = (dataCell.scrollHeight + heightDelta) + 'px';
                        }, 0);

                        newCell.onmouseleave = function () {
                            dataCell.removeChild(newCell);
                        };

                        dataCell.appendChild(newCell);
                    }
                }, 500);
            };

            scope.cellMouseLeave = function (leaveEvent) {
                var dataCell = leaveEvent.target;
                var dataKey = dataCell.parentElement.className + dataCell.className;
                var subCell = dataCell.querySelector('.data-cell .overflow-hover');

                if (_.has(scope.hoverTimeouts, dataKey)) {
                    $timeout.cancel(scope.hoverTimeouts[dataKey]);
                    delete scope.hoverTimeouts[dataKey];
                }

                if (subCell) {
                    try {
                        dataCell.removeChild(subCell);
                    } catch(err) {
                        // we're going to ignore problems with this.
                    }
                }
            };

            scope.sortedBy = function (column, inverted) {
                return (scope.getSortedIndex(column, inverted) >= 0);
            };

            scope.reversePredicate = function (index) {
                var pred = scope.decompilePredicateString(scope.getPredicate()[index]);
                if (!_.isEmpty(pred.column)) {
                    pred.reverse = scope.parseReverseSort(pred.column, pred.reverse);
                    scope.predicate[index] = scope.compilePredicateString(pred.column, !pred.reverse, true);
                }
            };

            scope.updatePredicate = function (index, selectBoxValue) {
                var column = scope.findColumnFromPredicate(selectBoxValue);
                if (!_.isEmpty(column)) {
                    scope.predicate[index] = scope.compilePredicateString(column);
                }
            };

            scope.removePredicate = function (index) {
                if (scope.getPredicate().length > 1) {
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

            scope.menuShown = {};
            scope.toggleMenu = function (row, column) {
                if (scope.isMenuShown(row, column)) {
                    scope.menuShown = {};
                } else {
                    scope.menuShown = {col: column, row: row};
                }
            };

            scope.isMenuShown = function (row, column) {
                if (_.isUndefined(scope.menuShown)) {
                    scope.menuShown = {};
                }

                return (_.isEqual(scope.menuShown, {row: row, col: column}));
            };

            scope.executeAction = function (row, menuItem) {
                if (_.has(menuItem, 'action') && _.isFunction(menuItem.action)) {
                    menuItem.action(row);
                    scope.menuShown = {};
                }
            };

            // Have to a setTimeout so that it's there.
            setTimeout(function () {
                var stopProp = function (e) {
                    e.stopPropagation();
                };

                angular.element(document.querySelector('.data-table-config-container')).on('click', stopProp);
                angular.element(document.querySelector('.menu-column')).on('click', stopProp);
            }, 1);

            scope.$watch(scope.dataList, function () {
                var stopProp = function (e) {
                    e.stopPropagation();
                };
                angular.element(document.querySelector('.menu-column')).on('click', stopProp);
            }, true);

            $document.on('click', function () {
                this.toggleVisibility(false);
            }.bind(scope));
        }
    };
});

app.filter('UnusedSorts', function() {
    return function(configObject, predicates, currentColumn, sortableFunction) {
        return _.filter(configObject, function (column) {
            // This is here to find the sortField value
            var sortField = '';
            if (_.isObject(column)) {
                sortField = (column.sortField||(column.sortField !== false)) && column.sortField || column.dataField;
            }

            if (_.isFunction(sortableFunction) && !sortableFunction(column)) {
                return false;
            }
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
        var columnValue = {value: ''};
        allowEditing = (_.isUndefined(allowEditing)) ? true : allowEditing;

        var field = (_.has(column, 'displayField') && _.has(row, column.displayField)) ? column.displayField : column.dataField;

        if (!_.isArray(field)) {
            field = [field];
        }

        _.forEach(field, function (fieldName, fieldIndex, field) {
            if (_.has(this.row, fieldName)) {
                if (_.has(this.column, 'filter')) {
                    if (_.has(this.column, 'filterParameters')) {
                        this.columnValue.value += $filter(this.column.filter).apply(this, [this.row[fieldName]].concat(this.column.filterParameters));
                    } else {
                        this.columnValue.value += $filter(this.column.filter)(this.row[fieldName]);
                    }
                } else {
                    this.columnValue.value += this.row[fieldName];
                }

                if (fieldIndex < field.length - 1) {
                    this.columnValue.value += '\n';
                }

            }
        }, {columnValue: columnValue, column: column, row: row});

        columnValue = columnValue.value;
        if (allowEditing) {
            columnValue = ((_.isEmpty(columnValue)) && (_.has(column, 'emptyValue'))) ? column.emptyValue : columnValue;
        }

        return columnValue;
    };
});

app.filter('rxDataTableSorting', function ($filter) {
    var orderBy = $filter('orderBy');

    return function (data, predicate, pagerObject) {
        return (pagerObject.serverPaging) ? data : orderBy(data, predicate);
    };
});
