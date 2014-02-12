angular.module('demo').run(['$templateCache', function ($templateCache) {
	$templateCache.put('docs/templates/basic.html', '<h1>{{title}}</h1> <div class="bs-example"> <rx-data-table row-key="colorName" column-configuration="dtConfig" list-of-data="dtData" column-display="dtColumnDisplay" column-presets="dtColumnPresets" predicate="dtDefaultSort"> </rx-data-table> </div> <div class="highlight"> <pre class="html">' +
'        &lt;!--This is your HTML Template for this Table--&gt;' +
'        &lt;rx-data-table' +
'            row-key="colorName"' +
'            column-configuration="dtConfig"' +
'            list-of-data="dtData"' +
'            column-display="dtColumnDisplay"' +
'            column-presets="dtColumnPresets"' +
'            predicate="dtDefaultSort">' +
'        &lt;/rx-data-table&gt;' +
'    </pre> </div> <h3>The Data on the Controller Should look like:</h3> <pre>' +
'$scope.dtConfig = <span ng-bind-html="dtConfig | JSONPrint:true"></span>;' +
'$scope.dtData = <span ng-bind-html="dtData | JSONPrint:true"></span>;' +
'$scope.dtColumnPresets = <span ng-bind-html="dtColumnPresets | JSONPrint:true"></span>;' +
'$scope.dtColumnDisplay = <span ng-bind-html="dtColumnDisplay | JSONPrint:true"></span>;' +
'$scope.dtDefaultSort = <span ng-bind-html="dtDefaultSort | JSONPrint:true"></span>;' +
'</pre> ');
	$templateCache.put('docs/templates/main.html', '<h1>{{title}}</h1> ');
	$templateCache.put('docs/templates/simple.html', '<h1>{{title}}</h1> <div class="bs-example"> <rx-data-table column-configuration="dtConfig" list-of-data="dtData"></rx-data-table> </div> <div class="highlight"> <pre class="html">' +
'        &lt;!--This is your HTML Template for this Table--&gt;' +
'        &lt;rx-data-table' +
'           column-configuration="dtConfig"' +
'           list-of-data="dtData"' +
'        &lt;/rx-data-table&gt;' +
'    </pre> </div> <h3>The Data on the Controller Should look like:</h3> <pre class="json">' +
'$scope.dtConfig = <span ng-bind-html="dtConfig | JSONPrint:true"></span>;' +
'' +
'<span ng-bind-html="\'// This is generated via a function\' | CodeHighlight:js"></span>' +
'$scope.dtData = <span ng-bind-html="dtData | JSONPrint:true"></span>;' +
'</pre> ');
	$templateCache.put('docs/templates/typical.html', '<h1>{{title}}</h1> <div class="bs-example"> <rx-data-table row-key="ref_no" visibilty="true" column-configuration="dtConfig" list-of-data="dtData" column-display="dtColumnDisplay" column-presets="dtColumnPresets" predicate="dtDefaultSort" row-style="{class: \'item-color-mapping\', field: \'severity\', bool: false}" checkbox-event="checkEvent"> </rx-data-table> </div> <div class="highlight"> <pre class="html">' +
'        &lt;!--This is your HTML Template for this Table--&gt;' +
'        &lt;rx-data-table' +
'           row-key="ref_no"' +
'           visibilty="true"' +
'           column-configuration="dtConfig"' +
'           list-of-data="dtData"' +
'           column-display="dtColumnDisplay"' +
'           column-presets="dtColumnPresets"' +
'           predicate="dtDefaultSort"' +
'           row-style="{class: \'item-color-mapping\', field: \'severity\', bool: false}"' +
'           checkbox-event="checkEvent"&gt;' +
'        &lt;/rx-data-table&gt;' +
'    </pre> </div> <h3>The Data on the Controller Should look like:</h3> <pre>' +
'$scope.dtConfig = <span ng-bind-html="dtConfig | JSONPrint:true"></span>;' +
'$scope.dtData = <span ng-bind-html="dtData | JSONPrint:true"></span>;' +
'$scope.dtColumnPresets = <span ng-bind-html="dtColumnPresets | JSONPrint:true"></span>;' +
'$scope.dtColumnDisplay = <span ng-bind-html="dtColumnDisplay | JSONPrint:true"></span>;' +
'$scope.dtDefaultSort = <span ng-bind-html="dtDefaultSort | JSONPrint:true"></span>;' +
'</pre> ');
}]);