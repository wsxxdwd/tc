//初始化服务器
var http = require('http'),
	socket = require('socket.io'),//websocket
	urlH = require('./serverjs/urlHandler.js');//路由控制

var app = http.createServer(urlH.handler);	
var io = socket.listen(app);
var ipaddress = process.env.OPENSHIFT_INTERNAL_IP;	
var port      = process.env.OPENSHIFT_INTERNAL_PORT || 8080
//开启服务器
app.listen(port,ipaddress);
console.log("server listening on "+port);
//游戏初始化
var Game = require('./serverjs/gameserver.js');
game = new Game();
game.init();
//侦听websocket
game.addListener(io);