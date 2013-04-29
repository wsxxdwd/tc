//map对象
function MapCanvas(){
	//初始放大倍数
	var zoomNum = 15;
	//这是ingress的东西,不明觉厉
	this.initialize = function(){
		var position = new google.maps.LatLng(30.508003,114.413402);
		var styles =  [{featureType:"all", elementType:"all", stylers:[{visibility:"on"}, {hue:"#131c1c"}, {saturation:"-50"}, {invert_lightness:true}]}, {featureType:"water", elementType:"all", stylers:[{visibility:"on"}, {hue:"#005eff"}, {invert_lightness:false}]}, {featureType:"poi", stylers:[{visibility:"off"}]}, {featureType:"transit", elementType:"all", stylers:[{visibility:"off"}]}];
		//地图option
        var mapOptions = {
          center:position,
          zoom: zoomNum,
		  styles: styles,
		  disableDefaultUI: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
		//在map_canvas上构建地图
        this.map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);
	}
	//设立marker
	this.setMark = function(markId,position,flag){
		var image;
		var index
		if(flag == 1){
			image = '/img/player.png';
			index = 999;
		}else if(flag == 2){
			image = '/img/TP.png';
		}else if(flag == 3){
			index = 99;
		}
		var marker = new google.maps.Marker({
			position: position,
            map: this.map,
			icon: image,
			zIndex: index
        });
		//加入mark列表,方便查询
		markArray[markId] = marker;
	};
	//删除指定marker
	this.clearMark = function(markId){
		if(markArray[markId])
			markArray[markId].setMap(null);
	};
	//建立贸易点连线
	this.setLine = function(lineId,way,type){
		if(type == 0){
			color = '#00FF00';
		}else if(type == 1){
			color = '#FF0000';
		}
		var tradeline = [
			TPList[way[0]].position,
			TPList[way[1]].position
		];
		var tl = new google.maps.Polyline({
			map:this.map,
			path: tradeline,
			strokeColor: color,
			strokeOpacity: 1.0,
			strokeWeight: 2
		});
		lineArray[lineId] = tl;
	}
	//删除指定line
	this.clearLine = function(lineId){
		if(lineArray[lineId])
			lineArray[lineId].setMap(null);
	};
	//获取当前坐标
	this.getCurPos = function(callback){
		 if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) { 
				var curPos = new google.maps.LatLng(position.coords.latitude-0.002223, position.coords.longitude+0.005643); 
				callback(curPos);
			});
		} 
	};
	//移动地图焦点
	this.toPoint = function(position){
		this.map.setCenter(position);
	};
//控制缩放
	this.lockZoom = function(){
		google.maps.event.addListener(map,'zoom_changed',function() {
			if (map.getZoom() != zoomNum) map.setZoom(zoomNum);
		}); 
	};
	//绑定鼠标点击事件
	this.TPclickBind = function(id){
		google.maps.event.addListener(markArray[id], 'click',function(){
			TPList[id].getTPInfo();
			//distance(TPList[id].position,player.curPos);
		});
	};
	this.RPclickBind = function(id){
		google.maps.event.addListener(markArray[id], 'click',function(){
			socket.emit('collect',{user:player.id,rp:id,type:RPList[id].type})
			
		});
	};
}
//player
function Player(username,id,money,items,TPs,record,TLs,army,temp){
	this.name = username;
	this.id = id;
	this.items = items;
	this.money = money;
	//Trade Point的缩写
	this.TPs = TPs;
	this.TLs = TLs;
	this.army = army;
	//交易记录
	this.record = record;
	this.rplist = new Array();
	this.tempTL = temp;
	this.curPos = 0;
	//获取坐标
	gameMap.getCurPos(function(pos){
		player.curPos = pos;
		gameMap.setMark(player.id,player.curPos,1);
		gameMap.toPoint(player.curPos);
	});
	//玩家移动
	this.move = function(){
		gameMap.getCurPos(function(pos){
			player.curPos = pos;
			gameMap.clearMark(player.id);
			gameMap.setMark(player.id,player.curPos,1);
		});
	};
	//刷新manage面板,pmir分别代表玩家,人事,物品,记录
	this.manageChg = function(p,m,i,r){
		if(p){
			var playerContent = '';
			playerContent += '<table class="table table-bordered"><tbody>';
			playerContent += '<tr><td>姓名</td><td>'+this.name+'</td></tr>';
			playerContent += '<tr><td>金钱</td><td>'+this.money+'金龙币</td></tr></tbody></table>';
			$("#player").html(playerContent);
		}
		if(m){
			var personnelContent = '';
			personnelContent += '<table class="table table-bordered"><thead><tr><th>部队</th><th>数量</th><th>工资</th></tr></thead><tbody>';
			personnelContent += '<tr><td></td><td></td><td></td></tr></tbody></table>';
			$("#personnel").html(personnelContent);
		}
		if(i){
			var itemsContent = '';
			itemsContent += '<table class="table table-bordered"><thead><tr><th>物品</th><th>数量</th><th>买入均价</th></tr></thead><tbody>';
			for(var i = 0;i<this.items.length;i++)
				if(this.items[i].num != 0)
					itemsContent += '<tr><td>'+this.items[i].name+'</td><td>'+this.items[i].num+'</td><td>'+this.items[i].price+'</td></tr>';
			itemsContent += '</tbody></table>';
			$("#items").html(itemsContent);
		}
		if(r){
			var recordContent = '';
			recordContent += '<table class="table table-bordered"><thead><tr><th>时间</th><th>记录</th></tr></thead><tbody>';
			for(var i = 0;i<this.record.length;i++)
				recordContent += '<tr><td>'+this.record[i][0]+'</td><td>'+this.record[i][1]+' '+Items[this.record[i][4]].name+' 通过 '+this.record[i][3]+'\的贸易点</td></tr>';
			recordContent +='	</tbody></table>';
			$("#record").html(recordContent);
		}
		
	};
};
//商贸点
function TP(id,position,lord){
	this.id = id;
	this.position = position;
	this.lord = lord;
	this.items = new Array();
	this.money = 0;
	//发送贸易点信息请求
	this.getTPInfo = function(){
		socket.emit('query',{type:'TP',id:this.id});
	};
	//进行贸易
	this.trade = function(type,Id){
		time = curTime();
		//如果是玩家卖东西,则判断贸易点钱够不够
		if(type == 'sale'&&player.items[Id].num>0){
			//加入操作记录 
			tradeRecord.push([time,'sale',player.id,this.id,Id]);
			//交易点买入
			this.items[Id].buy();
			this.money -= Math.round(this.items[Id].price*0.8);
			//玩家卖出
			player.items[Id].sale();
			player.money += Math.round(this.items[Id].price*0.8);
			this.items[Id].change(0);
			//更新管理面板
			player.manageChg(1,0,1,0);
			//更新商贸点信息面板
			showTradeInfo('sale',this.id,this.lord,this.items,this.money);
		}else if(type == 'buy'&&player.money>=this.items[Id].price&&this.items[Id].num>0){
			tradeRecord.push([time,'buy',player.id,this.id,Id]);
			//贸易点卖出
			this.items[Id].sale();
			this.money += this.items[Id].price;
			
			//玩家买入
			player.items[Id].buy();
			player.money -= this.items[Id].price;
			player.items[Id].average(this.items[Id].price);
			
			this.items[Id].change(1);
			player.manageChg(1,0,1,0);
			showTradeInfo('buy',this.id,this.lord,this.items,this.money);
		}else{
			alert('交易没有达成!');
		}
	};
}
//资源点
function Resource(id,type,position){
	this.id = id;
	this.position = position;
	this.type = type;
	this.item = Items[type];
}
function tradeLine(id,way,belong){
	this.id = id;
	this.way = way;
	this.belong = belong;
	this.item;
}
//物品对象
function Item(name,price,min,max,grad,num,record){
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
		this.price = Math.round((this.price*(this.num-1)+num)/(this.num));
	}
}
var Items = new Array(
	new Item('鱼',10,10,20,1,0,[]),
	new Item('奶酪',40,40,90,1,0,[]),
	new Item('面包',30,30,50,1,0,[]),
	new Item('生肉',40,40,80,1,0,[]),
	new Item('蔬菜',20,20,40,1,0,[]),
	new Item('木材',30,30,60,1,0,[]),
	new Item('亚麻布',100,100,180,2,0,[]),
	new Item('棉花',50,50,100,2,0,[]),
	new Item('酒',80,80,150,2,0,[]),
	new Item('铁',120,120,200,2,0,[]),
	new Item('白银',250,250,400,2,0,[]),
	new Item('铁器',150,150,250,2,0,[]),
	new Item('黄金',450,450,800,3,0,[]),
	new Item('香料',600,600,900,3,0,[])
);
