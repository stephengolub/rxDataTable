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
            restrict: 'E',
            replace: true,
            scope: {
                pageTracking: '=',
                numberOfPages: '@'
            },
            link: function (scope) {
                scope.$watch(function () {
                    return scope.pageTracking.total;
                }, function () {
                    if (scope.pageTracking.pageNumber >= scope.pageTracking.totalPages) {
                        scope.pageTracking.pageNumber = 0;
                    }
                });
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
            this.serverPaging = false;
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
 * @param {Object} pager-object This is the page tracking service instance to
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
                pagerObject: '=?'
            },
            link: function(scope) {
                if (_.isUndefined(scope.pagerObject)) {
                    scope.pagerObject = PageTracking.createInstance();
                }

                if (!scope.pagerObject.pageInit) {
                    scope.pagerObject.pageInit = true;
                }
                            
                try {
                    scope.updatePaging = function () {
                        scope.pagerObject.itemsPerPage = parseInt(scope.pagerObject.itemsPerPage, 10);
                        scope.pagerObject.pageNumber = 0;
                    }.bind(scope);
                } catch (err) {
                    // This is here because the tests are being weird.
                }

                scope.pagerObject.itemSizeList = _.range(scope.pagerObject.MIN_PER_PAGE,
                    scope.pagerObject.MAX_PER_PAGE + scope.pagerObject.ITEMS_PER_PAGE_STEP,
                    scope.pagerObject.ITEMS_PER_PAGE_STEP);
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
 * @param {Object} pager-object The instance of the PageTracking service. If not
 * specified, a new one will be created.
 *
 * @returns {Object} The list of items for the current page in the PageTracking object
 */
    .filter('Paginate', function (PageTracking) {
        return function (items, pagerObject) {
            if (!pagerObject) {
                pagerObject = PageTracking.createInstance();
            }
            if (pagerObject.showAll) {
                pagerObject.total = items.length;
                return items;
            }
            if (items) {
                if (!pagerObject.serverPaging) {
                    pagerObject.total = items.length;
                } else if (!_.isNumber(pagerObject.total)) {
                    pagerObject.total = 0;
                }

                pagerObject.totalPages = Math.ceil(pagerObject.total / pagerObject.itemsPerPage);

                var modifier = (pagerObject.serverPaging) ? 1 : 0;
                var first = pagerObject.pageNumber * pagerObject.itemsPerPage;
                var added = first + pagerObject.itemsPerPage;
                var last = ((added > items.length) ? items.length : added) - modifier;

                pagerObject.first = parseInt(first + 1, 10);
                pagerObject.last = parseInt(last, 10);
                if (pagerObject.serverPaging) {
                    pagerObject.last += pagerObject.first;
                }

                return (pagerObject.serverPaging) ? items : items.slice(first, last);
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
 * @param {Object} pager-object The instance of the PageTracking service. If not
 * specified, a new one will be created.
 *
 * @returns {Array} The list of page numbers that will be displayed.
 */
    .filter('Page', function (PageTracking) {
        return function (pagerObject) {
            if (!pagerObject) {
                pagerObject = PageTracking.createInstance();
            }

            var displayPages = [],
                // the next four variables determine the number of pages to show ahead of and behind the current page
                pagesToShow = pagerObject.pagesToShow || 5,
                pageDelta = (pagesToShow - 1) / 2,
                pagesAhead = Math.ceil(pageDelta),
                pagesBehind = Math.floor(pageDelta);

            if ( pagerObject && pagerObject.length !== 0) {
                    // determine starting page based on (current page - (1/2 of pagesToShow))
                var pageStart = Math.max(Math.min(pagerObject.pageNumber - pagesBehind, pagerObject.totalPages - pagesToShow), 0),

                    // determine ending page based on (current page + (1/2 of pagesToShow))
                    pageEnd = Math.min(Math.max(pagerObject.pageNumber + pagesAhead, pagesToShow - 1), pagerObject.totalPages - 1);

                for (pageStart; pageStart <= pageEnd; pageStart++) {
                    // create array of page indexes
                    displayPages.push(pageStart);
                }
            }

            return displayPages;
        };

    });
