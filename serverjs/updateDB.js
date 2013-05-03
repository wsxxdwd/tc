//mongo���ݿ����
var mongoose = require('mongoose');
var fs = require('fs');
mongoose.connect('mongodb://localhost/namepool');
//�������ݿ�
var db = mongoose.connection;
var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
//��
var firstname = new Schema({
	 first	: String
});
var Firstname = mongoose.model('Firstname',firstname);
//��
var lastname = new Schema({
	 last	: String
});
var Lastname = mongoose.model('Lastname',lastname);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
	console.log('name pool connected');
	//loadname();
	//clear();
	//list();
	getname();
});
function loadname(){
	var filehandle = fs.readFile('../nameDB.wtp',"utf8",function(err,data){
		//console.log(data);
		var str = data.toString();
		str = str.replace(/\t+|\r+|[*]+|\/\/.+/g,'\n');
		str = str.split(/\n+/);
		str.length --;
		console.log(str);
		console.log(str.length);
		//д�����ݿ�
		for(var i = 1;i<str.length;i++){
			if(i%2 == 1){
				var firstName = new Firstname({first:str[i]});
				firstName.save(function (err,docs){});
			}else{
				var lastName = new Lastname({last:str[i]});
				lastName.save(function (err,docs){});
			}
		}
	});
}
function clear(){
	Lastname.remove('',function(err,docs){  
           console.log(docs);  
    });
	Firstname.remove('',function(err,docs){  
           console.log(docs);  
    });
}
function list(){
	Firstname.find('',function(err,docs){
		console.log(docs);  
    });
	Lastname.find('',function(err,docs){
		console.log(docs);  
    });
}
function getname(){
	var first,last;
	Firstname.find('',function(err,docs){
		first = docs;
		Lastname.find('',function(err,docs){
			last = docs;
			for(var i = 0;i<40;i++)
				console.log(first[Math.round(Math.random()*(first.length-1))].first+'��'+last[Math.round(Math.random()*(last.length-1))].last);
		});
	});
}
