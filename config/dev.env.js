'use strict'
var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

// prodEnv.BASE_HUB_URL = '"http://192.168.1.36:59471/"'
prodEnv.BASE_HUB_URL = '"http://localhost:59471/"'

prodEnv.NODE_ENV = '"development"'

module.exports = prodEnv
