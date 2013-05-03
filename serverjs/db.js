//mongo数据库操作
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/tc');
//连接数据库
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {


var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
//用户对象
var user = new Schema({
	 name 		: String
	,psw   	 	: String
	,money		: Number
	,items		: Array
	,TPs		: Array
	,TLs		: Array
	,army		: Array
	,Pos		: Object
	,record		: Array
	,rplist		: Array
	,temp		: Array
});
var User = mongoose.model('User',user);
//贸易点对象
var tp = new Schema({
	 lord		: String
	,items		: Array
	,money		: Number
	,rank		: Number
	,tax		: Number
	,need		: Array
	,output		: Array
	,Pos		: Object
	,timer		: Number
});
var TradePoint = mongoose.model('TP',tp);

//贸易线路对象
var tl = new Schema({
	 keeper		: String
	,from    	: String
	,to			: String
	,dis		: Number
	,time 		: Number
	,item		: Array
	,guard		: Array
	,risk		: Number
	,timer		: Number
});
var TradeLine = mongoose.model('TL',tl);

//资源点对象
var rp = new Schema({
	 type	: Number
	,Pos	: Object
});
var ResourcePoint = mongoose.model('RP',rp);

//===============================玩家相关========================
//玩家注册
exports.signIn = function(username,password,Items,callback){
	//实例化一个玩家并加入数据库
	var temp = new Array();
	for(var i = 0;i<Items.length;i++)
		temp.push([0,0,0]);
	var newUser = new User({name:username,psw:password,money:500,items:temp});
	newUser.save(function (err,docs) {
		if (err) console.log(err);
		console.log('user sign in');
		callback(docs);
	});
};
//删除玩家
exports.delUser = function(condition){
	User.remove(condition,function(err,docs){  
           console.log(docs);  
      });
};
//检索玩家,返回玩家对象
exports.findUser = function(condition,callback){
	User.find(condition,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
};
//更新玩家数据,返回数量
exports.updateUser = function(condition,update,option,callback){
	User.update(condition,update,option,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
}

//=========================================贸易点相关===========================
//添加贸易点
exports.addTP = function(name,location,Items,callback){
	//生成随机物资
	var itemsArray = new Array();
	for(var i = 0;i < Items.length;i++){
		if(rd(1)){
			itemsArray.push([rd(Items[i].max,Items[i].min),rd(10*(4-Items[i].grad)),0]);
		}else{
			itemsArray.push([rd(Items[i].max,Items[i].min),0,0]);
		}
	}
	var newTP = new TradePoint({
		lord:name,
		items:itemsArray,
		Pos:location,
		rank:1,
		tax:0.05,
		output:[rd(Items.length-1)],
		need:[rd(Items.length-1)],
		timer:0
	});
	newTP.save(function (err,docs) {
		if (err) console.log(err);
		console.log('TP set up');
		callback(docs.id);
	});
	
}
//检索贸易点,返回贸易点对象
exports.findTP = function(condition,callback){
	TradePoint.find(condition,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
}
//更新贸易点信息,返回更新数量
exports.updateTP = function(condition,update,option,callback){
	TradePoint.update(condition,update,option,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
}
//删除贸易点
exports.delTP = function(condition){
	TradePoint.remove(condition,function(err,docs){  
           console.log(docs);  
      });
};
//=========================================贸易线路相关===========================
//添加贸易线路
exports.addTL = function(keeper,item,from,to,dis,time,callback){
	var newTL = new TradeLine({
		keeper:keeper,
		from:from,
		item:item,
		to:to,
		risk:0.3,
		time:time,
		dis:dis,
		timer:0
	});
	newTL.save(function (err,docs) {
		if (err) console.log(err);
		console.log('TL set up');
		callback(docs.id);
	});
	
}
//检索贸易线路,返回贸易线路对象
exports.findTL = function(condition,callback){
	TradeLine.find(condition,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
}
//更新贸易线路信息,返回更新数量
exports.updateTL = function(condition,update,option,callback){
	TradeLine.update(condition,update,option,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
}
//删除贸易线路
exports.delTL = function(condition){
	TradeLine.remove(condition,function(err,docs){  
           console.log(docs);  
    });
};
//=========================================资源点相关===========================
//添加资源点
exports.addRP = function(type,pos,callback){
	var newRP = new ResourcePoint({
		type:type,
		Pos:pos
	});
	newRP.save(function (err,docs) {
		if (err) console.log(err);
		console.log('RP set up');
		console.log('RP set up');
		callback(docs.id);
	});
	
}
//检索资源点,返回资源点对象
exports.findRP = function(condition,callback){
	ResourcePoint.find(condition,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
}
//更新资源点信息,返回更新数量
exports.updateRP = function(condition,update,option,callback){
	ResourcePoint.update(condition,update,option,function(err,docs){ 
		if(docs){
			callback(docs);
		}else{
			callback(0);
		}
	});
}
//删除资源点
exports.delRP = function(condition){
	ResourcePoint.remove(condition,function(err,docs){  
           console.log(docs);  
    });
};
});//database open

//自定义的随机函数,就是输入最大值与最小值,返回中间的整数
function rd(n,m){
	m = (typeof(m) == "undefined")?0:m;
	return Math.round(Math.random()*(n-m)+m);
}