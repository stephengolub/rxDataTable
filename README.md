[![Build Status](https://api.travis-ci.org/nickburns2006/rxDataTable.png)](https://travis-ci.org/nickburns2006/rxDataTable)
Data Table Directive
==========================
 
##Overview##
The `rx-data-table` directive is designed to pretty much be a catch-all
solution for displaying data in a table format in a basic or extremely
complex style. It has some basic CSS styling included, but provides hooks
for you to attach conditional styles to each row or column.
   
###Some Key Features###
- Single or Multi-Column Sorting
- Column Display Presets
- Individual Data-Driven Cell Styling
- CSS FlexBox display for fluid space display
- Inline Field Editing
    - Text Editing
    - Multi-Option Selects
    - Typeahead auto-complete

##Get started##

1. You must already have an angular project set up.
2. Install via [bower](http://bower.io):
```
bower install angular-rx-data-table
```
3. Include angular-rx-data-table in your code
```
<link href="bower_components/angular-rx-data-table/dist/styles/rx-data-table.min.css" rel="stylesheet">
<script src="bower_components/angular-rx-data-table/dist/scripts/rx-data-table.min.js"></script>
```
4. Add the module to your app's dependencies:
```
var app = angular.module("app", ["rxDataTable"]);
```
5. For further instructions on how to use the directive, view the full
   documentation [here](http://nickburns2006.github.io/rxDataTable).

##Dependencies##

Obviously this requires you to have an [angularjs](http://angularjs.org/)
project to use this.

This project uses the [angular-xeditable](http://vitalets.github.io/angular-xeditable/ "angular-xeditable homepage") for it's inline editing capabilities.

##TODO##
1. Set up multiple examples for quick implementation.
2. Simplify usage for basic implementations.

##License##

[MIT](./LICENSE.md)
