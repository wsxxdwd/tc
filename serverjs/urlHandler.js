//加载页面处理(路由控制
var	fs = require('fs');//文件操作模块
var url = require('url');//url模块
exports.handler = function(req, res) {
	var pathname = url.parse(req.url).pathname;
	console.log(pathname);
	var ext = pathname.match(/(\.[^.]+|)$/)[0];//取得后缀名
	switch(ext){
		case ".css":
		case ".js":
			//如果文件结尾是js或css则head如下
			fs.readFile("."+req.url,'utf-8',function(err,data){
				if(err) throw err;
				res.writeHead(200,{
					 "Content-Type": {
                             ".css":"text/css",
                             ".js":"application/javascript",
                      }[ext]
                    });
					res.end(data);
				});
			break;
		case ".png":
			//如果文件结尾是png则head如下
			fs.readFile("."+req.url,'binary',function(err,data){
				if(err) throw err;
				res.writeHead(200,{"Content-Type": "image/png"});
				res.end(data,"binary");
			});
			break;
		default:
				//其他的结尾按html处理
				if(pathname == "/"){
					fs.readFile(__dirname+'./../index.html','utf-8',
						function(err, data){
							if(err) throw err;
							res.writeHead(200,{"Content-Type": "text/html"});
							res.end(data);
					});
				}else if(pathname == "/map"){
					fs.readFile(__dirname+'./../map.html','utf-8',
						function(err, data){
							if(err) throw err;
							res.writeHead(200,{"Content-Type": "text/html"});
							res.end(data);
					});
				}else{
					console.log("No request handler found for " + pathname); 
					res.writeHead(404, {"Content-Type": "text/html"}); 
					res.write("404 Not found"); 
					res.end(); 
				}
		}
}