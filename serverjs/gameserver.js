//游戏服务器
var db = require('./db.js');
//物品对象
function item(name,price,min,max,grad,num,record){
	this.name = name;
	this.price = price;
	this.max = max;
	this.min = min;
	this.grad = grad;
	this.num = num;
	this.record = record;
	this.buy = function(){
		this.num++;
		this.record--;
	}
	this.sale = function(){
		this.num--;
		this.record++;
	}
	this.change = function(flag){
		if(this.record>0&&flag == 1){
			if(Math.ceil(this.price*(1+this.grad*0.03))<this.max)
				this.price = Math.ceil(this.price*(1+this.grad*0.03));
		}else if(this.record<0&&flag == 0){
			if(Math.floor(this.price*(1-this.grad*0.03))>this.min)
				this.price = Math.floor(this.price*(1-this.grad*0.03));
		}
	};
	this.average = function(num){
		this.price = Math.round((this.price*this.num+num)/(this.num+1));
	}
}
var Items = new Array(
	new item('鱼',10,10,20,1,0,[]),
	new item('奶酪',40,40,90,1,0,[]),
	new item('面包',30,30,50,1,0,[]),
	new item('生肉',40,40,80,1,0,[]),
	new item('蔬菜',20,20,40,1,0,[]),
	new item('木材',30,30,60,1,0,[]),
	new item('亚麻布',100,100,180,2,0,[]),
	new item('棉花',50,50,100,2,0,[]),
	new item('酒',80,80,150,2,0,[]),
	new item('铁',120,120,200,2,0,[]),
	new item('白银',250,250,400,2,0,[]),
	new item('铁器',150,150,250,2,0,[]),
	new item('黄金',450,450,800,3,0,[]),
	new item('香料',600,600,900,3,0,[])
);

//士兵对象
function soldier(name,price,type,state,num,value){
	this.name = name;
	this.price = price;
	this.type = type;
	this.state = state;
	this.num = num;
	this.value = value;
}

function Game(){
	//初始化
	this.init = function(){
		console.log("game server start");
	};
	//侦听器开启
	this.addListener = function(io){
		//连接
		io.sockets.on('connection',function(socket){
			
			/*看毛看,这就是个临时清空数据库的东西
			db.updateRP('',{$set:{Pos:{jb:30.590886,kb:114.3110360001106}}},{multi: true},function(res){console.log(res);});
			db.delUser({name:'wang'});
			db.updateTP({output:[14]},{$set:{output:[13]}},{multi: true},function(res){console.log(res);});
			db.updateUser({name:'diwang'},{$set:{temp:[]}},{multi: true},function(res){console.log(res);});
			db.addRP(0,)
			db.delTP('');
			db.delTL('');
			*/
			//输出当前的贸易点与玩家,测试用
			db.findUser('',function(docs){
				console.log(docs);
			}); 
			db.findTP('',function(docs){
				console.log(docs);
			}); 
			db.findTL('',function(docs){
				console.log(docs);
			});
			db.findRP('',function(docs){
				console.log(docs);
			});
			console.log('a player connects');
			//登录或注册
			socket.on('login',function(data){	
				login(socket,data);
			});
			//添加贸易点/资源点
			 socket.on('setTP',function(data){
				db.addTP(data.lord,data.location,Items,function(TPid){
					socket.emit('TPId',{id:TPid});
				});
			}); 
			socket.on('setRP',function(data){
				db.addRP(rd(Items.length-1),data.location,function(RPid){
					socket.emit('RPId',{id:RPid});
				});
			}); 
			socket.on('setTLStart',function(data){
				db.updateUser({_id:data.id},{$set:{temp:data.temp}},'',function(){});
			});
			socket.on('setTLEnd',function(data){
				db.findUser({_id:data.id},function(user){
					var temp = user[0].temp;
					db.addTL(user[0]._id,temp[1],temp[0],data.to,data.dis,data.dis*200,function(TLid){
						socket.emit('TLId',{id:TLid});
					});
				});
			}); 
			//资源点采集
			socket.on('collect',function(data){
				db.findUser({_id:data.user},function(user){
					collection(socket,user[0],data.rp,data.type);
				});
			});
			//处理各种查询操作
			socket.on('query',function(data){
				console.log('query TP');
				switch(data.type){
					case 'User':
						//玩家信息查询
						db.findUser({_id:data.id},function(userMsg){
							socket.emit("userMsg",{user:userMsg});
						});
						break;
					case 'TP':
						//贸易点查询
						db.findTP({_id:data.id},function(TPMsg){
							socket.emit("TPMsg",{TP:TPMsg});
						});
						break;
					case 'TPList':
						//贸易点列表查询,返回所有贸易点信息
						db.findTP('',function(TPList){
							var TPs = new Array();
							for(var i = 0;i<TPList.length;i++){
								TPs.push([TPList[i].Pos,TPList[i]._id,TPList[i].lord])
							}
							socket.emit("TPList",{list:TPs});
						});
						break;
					case 'RPList':
						//贸易点列表查询,返回所有贸易点信息
						db.findRP('',function(RPList){
							socket.emit("RPList",{list:RPList});
						});
						break;
					case 'TLList':
						//贸易线路列表查询,返回所有贸易线路信息
						db.findTL('',function(TLList){
							var TLs = new Array();
							var belong;
							for(var i = 0;i<TLList.length;i++){
								TLList[i].keeper == data.id?belong = 0:belong = 1;
								TLs.push([TLList[i]._id,[TLList[i].from,TLList[i].to],TLList[i].item,belong])	
							}
							socket.emit("TLList",{list:TLs});
						});
						break;
				}
			});
			//贸易操作验证
			socket.on('confirmAction',function(data){
				checkAction(socket,data.action,data.money);
			});
			//连接丢失
			socket.on('disconnect',function(socket){
				console.log('a player disconnects');
			});
			//tick
			var timer = setInterval(tick,5000);
		
		});	
	}
		

}//end of Game
//=====================tick=======================
function tick(){
	var d=new Date();
	db.findTP('',function(TPs){
		for(var i = 0 ;i<TPs.length;i++){
			if(d.getTime() >= TPs[i].timer){
				output(TPs[i]);
				TPs[i].timer = d.getTime()+7200000;
				db.updateTP({_id:TPs[i]._id},{$set:{timer:TPs[i].timer}},function(res){});
			}	
		}
	});
}
//=============================功能模块=================================
	//登录注册模块
function login(socket,data){
	//检查用户名存在
	db.findUser({name:data.username},function(userMsg){
		if(userMsg == 0){
			//用户名不存在,注册
			db.signIn(data.username,data.password,Items,function(userMsg){
				socket.emit("loginMsg",{type:'register',user:userMsg});	
				console.log('a player registers');
			});
		}else{
			//用户名存在,检查密码
			db.findUser({name:data.username,psw:data.password},function(userMsg){
				if(userMsg == 0){
					//密码错误
					socket.emit("loginMsg",{type:'errPsw'});
				}else{
					//登录成功,返回信息
					socket.emit("loginMsg",{type:'login',user:userMsg});
					console.log('a player login');
				}
			});	
		}
	});
}
//验证操作并更新数据库
function checkAction(socket,action,money){
	var user;
	var TP;
	//查询操作的用户和贸易点
	db.findUser({_id:action[0][2]},function(userMsg){
		user = userMsg[0];
		user.items = makeItems(user.items);
		db.findTP({_id:action[0][3]},function(TPMsg){
			TP = TPMsg[0];
			TP.items = makeItems(TP.items);
			if(checkStart())
				socket.emit('acitonResult',{res:'err'});
		});
	});
	//重现操作
	function checkStart(){
	 //与客户端相同,只是使用的数据是数据库中的,注释详见
		for(var i = 0;i<action.length;i++){
			var a = action[i];
			if(a[1] == 'buy'&&TP.items[a[4]].num>0&&user.money>TP.items[a[4]].price){	
				TP.items[a[4]].sale();
				user.items[a[4]].buy();
				TP.money += TP.items[a[4]].price;
				user.money -= TP.items[a[4]].price;
				
				user.items[a[4]].average(TP.items[a[4]].price);
				TP.items[a[4]].change(1);
			}else if(a[1] == 'sale'&&user.items[a[4]].num>0){
				TP.items[a[4]].buy();
				user.items[a[4]].sale();
				TP.money -= Math.round(TP.items[a[4]].price*0.8);
				user.money += Math.round(TP.items[a[4]].price*0.8);
				
				
				TP.items[a[4]].change(0);
			}
			a[3] = TP.lord;
		}
		//验证金钱是否正确
		if(money != user.money){
			console.log('money: '+money+' user.money:'+user.money);
			return true;
		}else{
			TP.items = liteItems(TP.items);
			user.items = liteItems(user.items);
			//一切ok,更新数据库
			user.record.reverse();
			user.record = user.record.concat(action);
			user.record.reverse();
			if(user.record.length > 10)
				user.record.length = 10;
			db.updateUser({_id:user._id},{$set:{money:user.money,items:user.items,record:user.record}},{},function(){console.log('user '+user.name+' updated');});
			db.updateTP({_id:TP._id},{$set:{items:TP.items}},{},function(){console.log('TP '+TP.lord+' updated');});
		}
	}
}
function output(obj){
	var output = obj.output;
	for(var i = 0;i<output.length;i++){
		var id = output[i];
		obj.items[id][1] += ((4-Items[i].grad)*5);
	}
	db.updateTP({_id:obj._id},{$set:{items:obj.items}},'',function(res){});
}

//资源点采集
function collection(socket,player,rp,type){
	var d=new Date();
	for(var i = 0;i<player.rplist.length;i++){
		if(player.rplist[i][0] == rp){
			console.log('current:'+d.getTime()+'limit'+player.rplist[i][1]);
			if(d.getTime()<player.rplist[i][1]){
				socket.emit('colRes',{flag:0,type:type});
				return false;
			}else{
				player.rplist.splice(i,1);
			}
		}
	}
	if(rd(10) > 2*Items[type].grad){
		var number = rd((4-Items[type].grad)*3);
		player.items[type][1] += number;
		player.rplist.push([rp,d.getTime()+60000]);
		db.updateUser({_id:player._id},{$set:{items:player.items,rplist:player.rplist}},'',function(res){
			socket.emit('colRes',{flag:1,type:type,num:number});
		});
	}else{
		player.rplist.push([rp,d.getTime()+60000]);
		db.updateUser({_id:player._id},{$set:{rplist:player.rplist}},'',function(res){
			socket.emit('colRes',{flag:2,type:type});
		});
	}
}

//====================工具函数====================

function makeItems(items){
	var temp = new Array();
	extend(temp,Items);
	for(var i = 0;i<items.length;i++){
		temp[i].price = items[i][0];
		temp[i].num = items[i][1];
		temp[i].record = items[i][2];
	}
	return temp;
}
function liteItems(items){
	var temp = new Array();
	for(var i = 0;i<items.length;i++){
		temp.push([items[i].price,items[i].num,items[i].record])
	}
	return temp;
}

function getType(o){
    var _t;
    return ((_t = typeof(o)) == "object" ? o==null && "null" || Object.prototype.toString.call(o).slice(8,-1):_t).toLowerCase();
}
function extend(destination,source){
    for(var p in source){
        if(getType(source[p])=="array"||getType(source[p])=="object"){
            destination[p]=getType(source[p])=="array"?[]:{};
            arguments.callee(destination[p],source[p]);
        }else{
            destination[p]=source[p];
        }
    }
}
function rd(n,m){
	m = (typeof(m) == "undefined")?0:m;
	return Math.round(Math.random()*(n-m)+m);
}
module.exports = Game;