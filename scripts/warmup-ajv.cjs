'use strict';
// Pre-load ajv into the module cache before ESLint loads it.
// Without this, Metro bundler's file-watching can race with fresh ESLint
// process startup and cause ajv sub-modules to export {} instead of a function.
require('ajv');
