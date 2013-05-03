thisURL = document.URL; 
var socket = io.connect(thisURL);
gameListener();

window.onload = function(){
//各种绑定
	$("#submit").bind("click",function(){
		submit();//绑定登录按钮
	});
	$('#myTab a,#TPTab a').bind('click',function (e) {
		//绑定管理面板上方按钮
		e.preventDefault();
		$(this).tab('show');
	});
	$('#closeInfo').bind('click',function(){
		//绑定关闭管理面板按钮
		$('#infoBox').fadeOut(300);
	});	
	$('#closeTP').bind('click',function(){
		//绑定关闭贸易点信息按钮
		confirmTrade();
		$('#tradePoint').fadeOut(300);
	});
	//下方的选项
	$('#manage').bind('click',function(){
		$('#infoBox').fadeIn(300);
	});
	$('#loadTP').bind('click',function(){
		$('#tradePoint').fadeIn(300);
	});
	$('#setTP').bind('click',function(){
		setNewTP();
	});
	$('#setRP').bind('click',function(){
		setNewRP();
	});
	//gameInit('adivon',0);
}
//=========================================侦听===================================
function gameListener(){
//玩家登录
	socket.on("loginMsg",function(data){
		if(data.type == 'errPsw'){
			//登录失败
			$("#pswErr").css("display","inline");
			$("#psw").attr("class","control-group error");
		}else if(data.type == 'login'){
			//登录成功
			gameInit(data.user[0]);
		}else if(data.type == 'register'){
			//新用户注册,开启引导
			gameInit(data.user[0]);
			$("#tipHeader").html("欢迎来到跑商与把妹的世界")
			$("#tipBody").html("<p>你好,"+data.user[0].name+"!你可以开始旅程了~</p>");
			$("#tip").modal();
		}
	});
	//贸易点信息获得
	socket.on('TPMsg',function(data){
		//更新贸易点信息
		var TP = TPList[data.TP[0]._id];
		TP.lord = data.TP[0].lord;
		TP.items = makeItems(data.TP[0].items);
		TP.money = data.TP[0].money;
		//更新贸易点信息面板
		showTradeInfo('buy',TP.id,TP.lord,TP.items,TP.money);
		$('#tradePoint').fadeIn(300);
	});
	//操作失败反馈侦听
	socket.on('acitonResult',function(data){
		if(data.res == 'err'){
			$("#tipHeader").html("操作发生错误")
			$("#tipBody").html("<p>请检查网络连接或者刷新游戏</p>");
			$("#tip").modal();
		}
	});
	socket.on('colRes',function(data){
		if(data.flag == 0){
			$("#tipHeader").html("无法采集资源")
			$("#tipBody").html("<p>采集"+player.items[data.type].name+"不是个简单事,也许你还想再努力点,但是你实在是太累了,休息会再采集吧,或许来杯咖啡?反正请等一分钟吧</p>");
			$("#tip").modal();
		}else if(data.flag == 1){
			player.items[data.type].num += data.num;
			player.manageChg(1,0,1,0);
			$("#tipHeader").html("成功采集到了"+player.items[data.type].name)
			$("#tipBody").html("<p>努力的付出终于有了回报,你采集到了"+data.num+"单位"+player.items[data.type].name+"</p>");
			$("#tip").modal();
		}else{
			$("#tipHeader").html("没采集到任何东西")
			$("#tipBody").html("<p>"+player.items[data.type].name+"都躲起来了么?你辛辛苦苦的采集了半天,却什么都没有得到,你感叹了一句:都是世界的错!</p>");
			$("#tip").modal();
		}
	});
	socket.on('TLId',function(data){
		var tradeLine = new TradeLine(data.id,player.tempTL,0);
		player.tempTL.length = 0;
		TLList[data.id] = tradePoint;
		//地图上标记出来贸易线路
		gameMap.setLine(data.id,tempTL,0);
	});
	socket.on('RPId',function(data){
		var resourcePoint = new Resource(data.id,RPlocation,3);
		RPList[data.id] = resourcePoint;
		//地图上标记出来贸易点
		gameMap.setMark(data.id,RPlocation,2);
	});
	socket.on('TPId',function(data){
		var tradePoint = new TP(data.id,TPlocation,2);
		TPList[data.id] = tradePoint;
		//地图上标记出来贸易点
		gameMap.setMark(data.id,TPlocation,2);
	});
}

function submit(){
	//发送注册信息
	if($("#inputUser").attr("value")&&$("#inputPassword").attr("value")){
		socket.emit("login",{username:$("#inputUser").attr("value"),password:$("#inputPassword").attr("value")});
	}
}
//游戏初始化
function gameInit(user){
	$("#login").css("display","none");
	$("#screen").css("display","block");
	//地图mark数组
	markArray = new Array();
	lineArray = new Array();
	//游戏地图
	gameMap   = new MapCanvas();
	//玩家
	var items = makeItems(user.items);
	player    = new Player(user.name,user._id,user.money,items,user.TPs,user.record,user.TLs,user.army,user.temp);
	
	//刷新管理信息
	player.manageChg(1,1,1,1);
	//临时交易记录
	tradeRecord = new Array();
	//贸易点列表
	TPList    = new Array();
	//读取贸易点坐标
	loadTP();
	//资源点列表
	RPList    = new Array();
	//读取资源点坐标
	loadRP();
	//贸易线路列表
	TLList    = new Array();
	//读取贸易线路坐标
	loadTL();
	
	gameMap.initialize();
	//map.lockZoom();
	
	//主tick
	ticker = self.setInterval("tick()",3000);
}
//==================================贸易点相关操作============================================
//设立贸易点
function setNewTP(){
	var TPlocation ;
	gameMap.getCurPos(function(pos){
		//获取玩家当前坐标
		TPlocation = pos;
		socket.emit('setTP',{lord:player.name,location:TPlocation});
	});
		
		
}
//游戏开始时读取所有贸易点
function loadTP(){
	socket.emit('query',{type:'TPList'});
	socket.on('TPList',function(data){
		for(var i=0;i<data.list.length;i++){
			var TPlocation = new google.maps.LatLng(data.list[i][0].jb,data.list[i][0].kb); 
			var tradePoint = new TP(data.list[i][1],TPlocation,data.list[i][2]);
			gameMap.setMark(tradePoint.id,TPlocation,2);
			//贸易点列表,和上面那个有区别,存了所有贸易点信息
			TPList[tradePoint.id] = tradePoint;
			gameMap.TPclickBind(tradePoint.id);
		}
	});
}
//显示贸易点信息面板
function showTradeInfo(type,id,name,items,money){
	if(type == 'buy'){
		//购买模式
		TPInfo();
	}else if(type == 'sale'){
		//卖出模式
		playerInfo();
	}
	//读取贸易点商品信息
	function TPInfo(){
		var goods='';
		goods +='<h2>'+name+'贸易点</h2>';
		goods +='<h4>您的资金:'+player.money+'金龙币</h4>';
		goods +='<div class="btn-group" data-toggle="buttons-radio"><button type="button" id="buy" class="btn btn-primary active">Buy</button><button type="button" id="sale" class="btn btn-primary">Sale</button></div>';
		$("#buy").die();
		$("#sale").die();
		$("#sale").live('click',function(){return playerInfo();});
		goods += '<table class="table table-hover"><thead><tr><th>商品</th><th>数量</th><th>价格</th></tr></thead><tbody>';
		for(var i = 0;i<items.length;i++){
			if(items[i].num != 0){
				goods +=' <tr id="item'+i+'"><td>'+items[i].name+'</td><td>'+items[i].num+'</td><td>'+items[i].price+'</td></tr>';	
				$("#goods #item"+i).die();
				$("#goods #item"+i).live('click',dotrade(i));
			}
			function dotrade(a){
				return function(){
					TPList[id].trade('buy',a);
				}
			}
		}
		goods +='</tbody></table>';
		
		$('#tradePoint #goods').html(goods);
	}
	//读取的是玩家商品信息
	function playerInfo(){
		var goods = '';
		goods +='<h2>'+name+'贸易点</h2>';
		goods +='<div class="btn-group" data-toggle="buttons-radio"><button type="button" id="buy" class="btn btn-primary ">Buy</button><button type="button" id="sale" class="btn btn-primary active">Sale</button></div>';
		$("#buy").die();
		$("#sale").die();
		$("#buy").live('click',function(){return TPInfo();});
		goods += '<table class="table table-hover"><thead><tr><th>商品</th><th>数量</th><th>价格</th></tr></thead><tbody>';
		for(var i = 0;i<player.items.length;i++){
			if(player.items[i].num != 0){
				goods +=' <tr id="item'+i+'"><td>'+player.items[i].name+'</td><td>'+player.items[i].num+'</td><td>'+Math.round(items[i].price*0.8)+'</td></tr>';	
				$("#goods #item"+i).die();
				$("#goods #item"+i).live('click',dotrade(i));
			}
			function dotrade(a){
				return function(){
					TPList[id].trade('sale',a);
				}
			}
		}
		goods +='</tbody></table>';
		goods +='<h4>资金:'+player.money+'金龙币</h4>';
		$('#tradePoint #goods').html(goods);
	}
	//贸易线路设置
	if(TLList == []&&(player.tempTL[0] != id||player.tempTL.length == 0)){
		showSetTL();
	}
	else if(player.tempTL[0] == id)
		$('#tradePoint #tradeLine').html("已设立贸易型线路起点,护卫:XX,贸易品:"+Items[player.tempTL[1]].name);
	else
		for(i in TLList){
			if(TLList[i].belong == 0&&(TLList[i].from == id||TLList[i].to == id)){
				showCloseTL(i);
			}else{
				showSetTL();
			}
		}
	function showCloseTL(id){
		var TLInfo = "<p>当前贸易点设有您的贸易线路.</p>";
		TLInfo += "<p>贸易线路建立在"+TPList[TLList[id].from].lord+"的贸易点与"+TPList[TLList[id].to].lord+"的贸易点之间.</p>";
		if(typeof(TLList[id].item) != "undefined"){
			TLInfo += "<p>此贸易线路正由XXX带领着进行着"+Items[TLList[id].item].name+"的贸易.</p>";
		}else{
			TLInfo += "<p>此贸易点暂时没有进行贸易.</p>";
		}
		TLInfo += '<button type="button" id="closeTL"class="btn btn-danger" data-loading-text="正在关闭...">关闭贸易线路</button>';
		$('#tradePoint #tradeLine').html(TLInfo);
		$('#closeTL').die();
		$('#closeTL').bind('click',function(){return closeTL()});
	}
	function showSetTL(){
		var TLInfo = "<p>当前贸易点您未设立贸易线路.<\p>";
		if(player.tempTL.length == 0){
			TLInfo += '<button type="button" id="setTLStart" class="btn btn btn-success" data-loading-text="正在设立...">设立贸易线路起始点</button>';
			$('#tradePoint #tradeLine').html(TLInfo);
			$('#setTLStart').die();
			$('#setTLStart').bind('click',function(){return TLStart()});
		}else{
			TLInfo += '<button type="button" id="setTLEnd" class="btn btn btn-success" data-loading-text="正在设立...">设立贸易线路终点</button>';
			$('#tradePoint #tradeLine').html(TLInfo);
			$('#setTLEnd').die();
			$('#setTLEnd').bind('click',function(){return setTLEnd(id)});
		}
		function TLStart(){
			TLInfo = "<p>选择商队护卫</p>";
			TLInfo += '<button class="btn btn-primary" id="confirmGuard" type="button">确认</button>';
			$('#tradePoint #tradeLine').html(TLInfo);
			$('#confirmGuard').die();
			$('#confirmGuard').bind('click',function(){
				TLInfo = "选择贸易物品";
				TLInfo += '<table class="table table-hover"><thead><tr><th>商品</th><th>数量</th><th>价格</th></tr></thead><tbody>';
				for(var i = 0;i<items.length;i++){
					if(items[i].num != 0){
						TLInfo +=' <tr id="item'+i+'"><td>'+items[i].name+'</td><td>'+items[i].num+'</td><td>'+items[i].price+'</td></tr>';	
						$('#tradePoint #tradeLine').html(TLInfo);
						$("#tradeLine #item"+i).die();
						$("#tradeLine #item"+i).live('click',TLStart(i));
						function TLStart(i){
							return function(){
								setTLStart(id,i);
								TLInfo = "<p>已设立贸易型线路起点,护卫:XX,贸易品:"+Items[i].name+"</p>";
								$('#tradePoint #tradeLine').html(TLInfo);
							}
						}
					}
				}
				TLInfo +='</tbody></table>';
			});
		}
	}
}
function confirmTrade(){
	//像服务端验证操作
	if(tradeRecord.length > 0){
		socket.emit('confirmAction',{action:tradeRecord,money:player.money});
		for(var i = 0;i<tradeRecord.length;i++)
			tradeRecord[i][3] = TPList[tradeRecord[i][3]].lord;
		player.record.reverse();
		player.record = player.record.concat(tradeRecord);
		player.record.reverse();
		if(player.record.length = 10)
			player.record.length = 10;
		player.manageChg(0,0,0,1);
		tradeRecord.length = 0;
	}
}
//=============================资源点相关========================
//设立贸易点
function setNewRP(){
	var RPlocation ;
	gameMap.getCurPos(function(pos){
		//获取玩家当前坐标
		RPlocation = pos;
		socket.emit('setRP',{location:RPlocation});
	});
}
function loadRP(){
	socket.emit('query',{type:'RPList'});
	socket.on('RPList',function(data){
		for(var i=0;i<data.list.length;i++){
			var RPlocation = new google.maps.LatLng(data.list[i].Pos.jb,data.list[i].Pos.kb); 
			var resourcePoint = new Resource(data.list[i]._id,data.list[i].type,RPlocation);
			gameMap.setMark(resourcePoint.id,RPlocation,3);
			//贸易点列表,和上面那个有区别,存了所有贸易点信息
			RPList[resourcePoint.id] = resourcePoint;
			gameMap.RPclickBind(resourcePoint.id);
		}
	});
}
//=============================贸易线路相关========================
//设立贸易线路
function setTLStart(TPId,item){
	player.tempTL.push(TPId,item);
	socket.emit('setTLStart',{id:player.id,temp:player.tempTL});
}
function setTLEnd(TPId){
	player.tempTL.push(TPId);
	var dis = distance(TPList[player.tempTL[0]].position,TPList[player.tempTL[2]].position);
	socket.emit('setTLEnd',{id:player.id,to:player.tempTL[2],dis:dis});
	$('#tradePoint #tradeLine').html('<p>已建立贸易线路</p><button type="button" id="closeTL"class="btn btn-danger" data-loading-text="正在关闭...">关闭贸易线路</button>');
	$('#closeTL').die();
	$('#closeTL').bind('click',function(){return closeTL()});
}
function loadTL(){
	socket.emit('query',{type:'TLList',id:player.id});
	socket.on('TLList',function(data){
		for(var i=0;i<data.list.length;i++){
			var tradeLine = new TradeLine(data.list[i][0],data.list[i][1][0],data.list[i][1][1],data.list[i][2],data.list[i][3]); 
			gameMap.setLine(tradeLine.id,tradeLine.from,tradeLine.to,tradeLine.belong);
			//贸易线路列表,和上面那个有区别,存了所有贸易线路信息
			TLList[tradeLine.id] = tradeLine;
		}
	});
}
//==============================工具函数==========================
function makeItems(items){
	var temp = new Array();
	extend(temp,Items);
	for(var i in items){
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
//自定义的随机函数,就是输入最大值与最小值,返回中间的整数
function rd(n,m){
	m = (typeof(m) == "undefined")?0:m;
	return Math.round(Math.random()*(n-m)+m);
}
 //calculate the distance between to position, return kilometers.   
function distance(LatLng1,LatLng2) {
	//alert(LatLng2);
	var a = Math.sin(LatLng1.lat() * Math.PI / 180) * Math.sin(LatLng2.lat() * Math.PI / 180);
	var b = Math.cos(LatLng1.lat() * Math.PI / 180) * Math.cos(LatLng2.lat() * Math.PI / 180) * Math.cos((LatLng2.lng() - LatLng1.lng()) * Math.PI / 180);
	return 6371000 * Math.acos(a + b); 
} 
//===========================================游戏循环======================================
function tick(){
	//玩家三秒动一下O(∩_∩)O~
	player.move();
	for(var i = 0;i<player.rplist.length;i++){
		player.rplist[i][1] -= 3;
		if(player.rplist[i][1] <= 0)
			player.rplist.splice(i,1);
	}
}
//当前时间
function curTime(){
	var myDate = new Date();
	return myDate.toLocaleString(); 
}
