var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var session = require('express-session');

var index = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var register = require('./routes/register');
var game = require('./routes/game');
var datas = require('./routes/datas');
// var server = require('./routes/server');

var app = express();

//session
app.use(cookieParser());
app.use(session({
    secret: '12345',
    name: 'cookiename',
    cookie: {
        maxAge: 3000000//5 * 60 * 1000
    },
    resave: false,
    saveUninitialized: true
}));

// socket.io
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('haveupdate', function () {
        console.log('user have sent messages');
        // except sender
        // socket.broadcast.emit('letsreload');
        // to all
        io.emit('letsreload');
    })
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', ejs.__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/login', login);
app.use('/register', register);
app.use('/game', game);
app.use('/datas', datas);
// app.use('/server', server);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
