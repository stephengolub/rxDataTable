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
