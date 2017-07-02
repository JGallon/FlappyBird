/**
 * Created by JGallon on 2017/6/20.
 */
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../model/config');
// 使用连接池，提升性能
var pool = mysql.createPool(config.mysql);

router.get('/', function (req, res, next) {
    // if (config.username === null)
    if (req.session.username === undefined)
        res.render('index', {title: 'Express'});
    else
        res.render('game', {title: 'Game'});
});

module.exports = router;