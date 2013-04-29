
//自定义的随机函数,就是输入最大值与最小值,返回中间的整数
function rd(n,m){
	m = (typeof(m) == "undefined")?0:m;
	return Math.round(Math.random()*(n-m)+m);
}