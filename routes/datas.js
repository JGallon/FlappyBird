/**
 * Created by JGallon on 2017/6/20.
 */
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var config = require('../model/config');
// 使用连接池，提升性能
var pool = mysql.createPool(config.mysql);

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/getUsername', function (req, res, next) {
    // res.render('index', { title: 'Express' });
    var result = {
        username: config.username
    };
    res.json(result);
});

router.post('/updateScore', function (req, res, next) {
    // var s = req.body.score;
    var score = parseInt(req.body.score);
    // var score = req.body.score;
    console.log(score);
    // var username = config.username;
    var username = req.session.username;
    pool.getConnection(function (err, connection) {
        // var $sql = "INSERT INTO scores(username, score) VALUES(?, ?)";
        // var sql = "select * from scores where username = ?";
        // var sql = "update scores set score = ? where username = ?";
        // var $sql = "insert into scores(username, score) values(?, ?)";
        var $sql = "insert into scores(username, score, time) VALUES(?, ?, now())";
        connection.query($sql, [username, score], function (err, result) {
            // console.log(result);
            if (result) {
                result = {
                    code: 200,
                    msg: '添加成功'
                };
            } else {
                result = {
                    code: 400,
                    msg: '添加失败'
                };
            }
            res.json(result); // 以json形式，把操作结果返回给前台页面
            connection.release();// 释放连接
        });
    });
});

router.post('/loadScore', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        var $sql = "select * from scores order by score desc limit 4;";
        connection.query($sql, [], function (err, result) {
            // console.log(result);

            var arr = new Array();
            for (var i = 0; i < result.length; i++) {
                var tmp = {name: result[i].username, score: result[i].score, time: result[i].time};
                // var tmp = {name: result[i].username, score: result[i].score};
                arr.push(tmp);
            }
            // console.log(arr);
            result = {
                list: arr
            };
            res.json(result); // 以json形式，把操作结果返回给前台页面
            connection.release();// 释放连接
        });
    });
});

module.exports = router;