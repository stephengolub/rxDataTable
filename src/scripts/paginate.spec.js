/* jshint node: true */
var items = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
    mockPageTracking = {
        itemsPerPage: 3,
        pageNumber: 0,
        totalPages: Math.ceil(items.length / 3),
        total: items.length,
        pagesToShow: 6,
        showAll: false,
        pageInit: false
    };
describe('Pagination', function () {
    describe('Directive: rxPaginate', function () {
        // TODO redo these tests to use class names for finding first, prev, next, last, etc items

        var el, items, scope, compile,
            validTemplate = '<rx-data-table-paginate page-tracking="pager"></rx-data-table-paginate>';

        beforeEach(function() {
            // Load the directive's module
            module('rxDataTable');
            module('src/templates/rx-data-table-paginate.html');

            // Inject in angular constructs
            inject(function($rootScope, $compile) {
                scope = $rootScope.$new();
                scope.pager = angular.copy(mockPageTracking);
                compile = $compile;
            });

            el = helpers.createDirective(angular.element(validTemplate), compile, scope);

            items = el.find('li');
        });

        afterEach(function () {
            // zero out link element
            el = null;
            items = null;
        });

        it('should link to "first" link non-first page', function () {
            var item = items.eq(0);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            scope.pager.pageNumber = 3;

            scope.$digest();

            expect(item.hasClass('disabled')).to.be.false;
            expect(link.hasClass('ng-hide')).to.be.false;
            expect(span.hasClass('ng-hide')).to.be.true;

            // clicking link should move to first page
            helpers.clickElement(link[0]);

            expect(scope.pager.pageNumber).to.equal(0);
        });

        it('should disable "first" link on first page', function () {
            var item = items.eq(0);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            expect(item.hasClass('disabled')).to.be.true;
            expect(link.hasClass('ng-hide')).to.be.true;
            expect(span.hasClass('ng-hide')).to.be.false;
        });


        it('should link to "prev" link when previous page available', function () {
            var item = items.eq(1);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            scope.pager.pageNumber = 3;

            scope.$digest();

            expect(item.hasClass('disabled')).to.be.false;
            expect(link.hasClass('ng-hide')).to.be.false;
            expect(span.hasClass('ng-hide')).to.be.true;

            // clicking link should move to first page
            helpers.clickElement(link[0]);

            expect(scope.pager.pageNumber).to.equal(2);
        });

        it('should disable "prev" link on first page', function () {
            var item = items.eq(1);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            expect(item.hasClass('disabled')).to.be.true;
            expect(link.hasClass('ng-hide')).to.be.true;
            expect(span.hasClass('ng-hide')).to.be.false;
        });


        it('should link to individual page numbers', function () {
            var item = items.eq(2);
            var link = item.find('a').eq(0);

            expect(item.hasClass('pagination-page'), 'should be on pagination-page link').to.be.true;
            expect(item.hasClass('active'), 'link should be active').to.be.true;

            expect(link.text()).to.equal('1');

            // now try with second page link
            item = items.eq(3);
            link = item.find('a').eq(0);

            expect(item.hasClass('pagination-page'), 'should be on pagination-page link').to.be.true;
            expect(item.hasClass('active'), 'link should be inactive').to.be.false;

            expect(link.text()).to.equal('2');

            // clicking link should move to first page
            helpers.clickElement(link[0]);

            expect(item.hasClass('active'), 'link should be inactive').to.be.true;
            expect(scope.pager.pageNumber).to.equal(1);
        });

        it('should have # of page numbers as configured', function () {
            var pagesShowing = el[0].getElementsByClassName('pagination-page');
            expect(pagesShowing).to.have.length(scope.pager.pagesToShow);
        });


        it('should link to "next" link when next page available', function () {
            var item = items.eq(items.length - 2);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            expect(item.hasClass('disabled')).to.be.false;
            expect(link.hasClass('ng-hide')).to.be.false;
            expect(span.hasClass('ng-hide')).to.be.true;

            // clicking link should move to first page
            helpers.clickElement(link[0]);

            expect(scope.pager.pageNumber).to.equal(1);
        });

        it('should disable "next" link on last page', function () {
            scope.pager.pageNumber = scope.pager.totalPages - 1;

            scope.$digest();

            var item = items.eq(items.length - 2);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            expect(item.hasClass('disabled')).to.be.true;
            expect(link.hasClass('ng-hide')).to.be.true;
            expect(span.hasClass('ng-hide')).to.be.false;
        });

        it('should link to "last" link non-last page', function () {
            var item = items.eq(items.length - 1);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            // make sure we're on the "last" item
            expect(item.hasClass('pagination-last'));

            expect(item.hasClass('disabled'), 'item is disabled').to.be.false;
            expect(link.hasClass('ng-hide'), 'link is disabled').to.be.false;
            expect(span.hasClass('ng-hide'), 'span is not disabled').to.be.true;

            // clicking link should move to last page
            helpers.clickElement(link[0]);

            expect(scope.pager.pageNumber).to.equal(scope.pager.totalPages - 1);
        });

        it('should disable "last" link on last page', function () {
            scope.pager.pageNumber = scope.pager.totalPages - 1;

            scope.$digest();

            var item = items.eq(items.length - 1);
            var link = item.find('a').eq(0);
            var span = item.find('span').eq(0);

            // make sure we're on the "last" item
            expect(item.hasClass('pagination-last'));

            expect(item.hasClass('disabled')).to.be.true;
            expect(link.hasClass('ng-hide')).to.be.true;
            expect(span.hasClass('ng-hide')).to.be.false;
        });
    });

    describe('Filter: Page', function () {
        var page;

        beforeEach(function() {
            module('rxDataTable');

            inject(function($filter) {
                page = $filter('Page');
            });
        });

        it('should exist', function() {
            expect( !! page).to.be.true;
        });

        it('should return an array of pages to be displayed by', function () {
            // Test only one page
            expect(page({ pageNumber: 1, totalPages: 1 })).to.eql([0]);

            // Test first page when below pagesToShow limit
            expect(page({ pageNumber: 1, totalPages: 3 })).to.eql([0, 1, 2]);

            // Test last page of when below pagesToShow limit
            expect(page({ pageNumber: 3, totalPages: 3 })).to.eql([0, 1, 2]);

            // Test first page when above pagesToShow limit
            expect(page({ pageNumber: 1, totalPages: 20 })).to.eql([0, 1, 2, 3, 4]);

            // Test last page of when above pagesToShow limit
            expect(page({ pageNumber: 10, totalPages: 10 })).to.eql([5,6,7,8,9]);

            // Test a page that's deep within a total number of pages
            expect(page({ pageNumber: 15, totalPages: 102 })).to.eql([13,14,15,16,17]);
        });

        it('should allow for custom number of pages to show', function () {
            // Test a page that has odd # of custom pagesToShow
            expect(page({ pageNumber: 15, totalPages: 102, pagesToShow: 3 })).to.eql([14,15,16]);

            // Test first page that has even # of custom pagesToShow and is below pagesToShowLimit
            expect(page({ pageNumber: 1, totalPages: 4, pagesToShow: 4 })).to.eql([0,1,2,3]);

            // Test middle page that has even # of custom pagesToShow and is below pagesToShowLimit
            expect(page({ pageNumber: 2, totalPages: 4, pagesToShow: 4 })).to.eql([0,1,2,3]);

            // Test last page that has even # of custom pagesToShow and is below pagesToShowLimit
            expect(page({ pageNumber: 4, totalPages: 4, pagesToShow: 4 })).to.eql([0,1,2,3]);

            // Test first page that has even # of custom pagesToShow and is above pagesToShowLimit
            expect(page({ pageNumber: 1, totalPages: 102, pagesToShow: 4 })).to.eql([0,1,2,3]);

            // Test middle page that has even # of custom pagesToShow and is above pagesToShowLimit
            expect(page({ pageNumber: 15, totalPages: 102, pagesToShow: 4 })).to.eql([14,15,16,17]);

            // Test last page that has even # of custom pagesToShow and is above pagesToShowLimit
            expect(page({ pageNumber: 102, totalPages: 102, pagesToShow: 4 })).to.eql([98,99,100,101]);
        });
    });

    describe('Filter: Paginate', function () {
        var paginate, pager;

        beforeEach(function() {
            module('rxDataTable');

            // Provide any mocks needed
            module(function ($provide) {
                pager = angular.copy(mockPageTracking);
                $provide.value('PageTracking', pager);
            });

            inject(function($filter) {
                paginate = $filter('Paginate');
            });
        });

        it('should exist', function() {
            expect( !! paginate).to.be.true;
        });

        it('should return subset of items based on current page', function () {
            // expect first three pages to be returned from pagination
            expect(paginate(items, pager)).to.eql([0,1,2]);

            // change page and re-paginate
            pager.pageNumber = 2;
            expect(paginate(items, pager)).to.eql([6,7,8]);

            // last page should return remaining items
            pager.pageNumber = pager.totalPages - 1;
            expect(paginate(items, pager)).to.eql([15,16]);
        });
    });
});
