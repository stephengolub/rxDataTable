angular.module('demo')
.controller('mainCtrl', function ($scope) {
    $scope.title = 'Main';
})
.controller('simpleCtrl', function ($scope) {
    $scope.title = 'Triangle Numbers';
    $scope.dtConfig = [ { title: 'Index', dataField: 'index', cols: 1 },
                        { title: 'Number', dataField: 'triangle', cols: 1 }];

    function generateTriangleNumbers (limit) {
        var data = [];
        for (var i = 1; i < limit + 1; i++) {
            var entry = {};
            entry.index = i;
            entry.triangle = (i * (i + 1)) / 2;
            data.push(entry);
        }
        return data;
    }
    $scope.dtData = generateTriangleNumbers(200);
    $scope.dtColumnPresets = [
        {
            'title': 'Default View',
            'config': [0,1]
        }
    ];

    $scope.dtColumnDisplay = {
        'index': 0,
        'config': [0,1]
    };
})
.controller('basicCtrl', function ($scope, TableInfo) {
    $scope.title = 'Colors';
    $scope.dtConfig = TableInfo.retrieve({type: 'config', level: 'basic'});
    $scope.dtData = TableInfo.retrieve({type: 'data', level: 'basic'});
    $scope.dtColumnPresets = [
        {
            'title': 'Default View',
            'config': [0,1,2,3]
        }
    ];

    $scope.dtColumnDisplay = {
        'index': 0,
        'config': [0,1,2,3]
    };

    $scope.dtDefaultSort = ['colorName'];
})
.controller('typicalCtrl', function ($scope, TableInfo) {
    $scope.title = 'Tickets';
    $scope.dtConfig = TableInfo.retrieve({type: 'config', level: 'typical'});
    $scope.dtData = TableInfo.retrieve({type: 'data', level: 'typical'});
    $scope.dtColumnPresets = [
        {
            'title': 'Default View',
            'config': [0,1,2,3,4]
        }
    ];

    $scope.dtColumnDisplay = {
        'index': 0,
        'config': [0,1,2,3,4]
    };

    $scope.dtDefaultSort = ['-severity'];
})
.controller('complexCtrl', function ($scope) {
    $scope.title = 'Complex';
})
.controller('fullFeaturedCtrl', function ($scope) {
    $scope.title = 'Full Featured';
});
