if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

controller.hears(['乗り換え','乗換'], ['ambient'], function(bot, message) {
	Norikae(bot,message);
})
// 短縮URL化に必要なトークンを取ってくる関数
// 指定した階層にトークンを記述したファイル
// ./token.txtを配置してください
function GetShortURLToken(){
	var fs = require('fs');
	var buf = fs.readFileSync("./var/token.txt");
	var token = buf.toString();
	return token;
}
// 乗り換え案内
function Norikae(bot,message){
	var in_str = message.text;
	var out_str = "";
	var in_url = "http://www.navitime.co.jp/transfer/searchlist?&basis=1&orvStationName=";
	var NorikaeST = in_str.split(/ |　/);
	if(NorikaeST.length >= 3){
		var StartST = NorikaeST[1];
		var EndST = NorikaeST[2];
		out_str = StartST + "駅 から" + EndST + "駅 までの乗換経路を表示します。\n";
		in_url += StartST + "&dnvStationName=" + EndST;
		if(NorikaeST.length >= 4){
			var NowDate = new Date();
			// N分前にマッチ
			if(in_str.match(/前|(B|b)efore/)){
				
			}
			else if(in_str.match(/後|(A|a)fter/)){
				
			}
			else{
				var settimeOK = true;
				// 10:00 時刻のみ
				if(NorikaeST.length == 4){
					var inHM = NorikaeST[3].split(":");
				}
				else{
					// 2010/01/01 10:20 フル形式
					var inYMD = NorikaeST[3].split("/");
					var inHM = NorikaeST[4].split(":");
					// 2要素以上あるかチェック
					settimeOK = (inYMD.length >= 2)?true:false;
					for(var i=0;i<inYMD.length;i++){
						inYMD[i] = Number(inYMD[i]);
						// 自然数判定
						if(!isInteger(inYMD[i]) || inYMD[i] <= 0){
							settimeOK = false;
						}
						console.log(inYMD[i]);
					}
					if(settimeOK){
						// 04/06 などの月日のみパターン
						if(inYMD.length == 2){
							in_url += "&month="+ inYMD[0];
							in_url += "&day=" + inYMD[1];
						}
						else{
							in_url += "&month="+ inYMD[0] +"%2F" + inYMD[1];
							in_url += "&day=" + inYMD[2];
						}
					}
				}
				settimeOK = true;
				// 時、分が揃っているかチェック
				settimeOK = (inHM.length >= 2)?true:false;
				for(var i=0;i<inHM.length;i++){
					inHM[i] = Number(inHM[i]);
					if(!isInteger(inHM[i]) || inHM[i] <= 0){
						settimeOK = false;
					}
					console.log(inHM[i]);
				}
				if(settimeOK){
					in_url += "&hour=" + inHM[0] + "&minute=" + inHM[1];
					console.log("OK!");
				}
			}
		}
		console.log(in_url);
		// 出来たURLを短縮化
		ShortURL(in_url,function(body){
			console.log("ShortURL:"+body.id);
			out_str += body.id;
			bot.reply(message,out_str);
		});
	}
	else{
		console.log("入力エラー");
		bot.reply(message,"乗換 {出発駅} {目的駅} 年/月/日 時間:分\nの形式で入力して下さい。");
	}
}
// 整数値判定
function isInteger(x){
	return Math.floor(x) === x;
}
// 短縮URLを作成する関数
function ShortURL(in_url,callback){
	var token = GetShortURLToken();
	var request = require('request');
	var set_url = "https://www.googleapis.com/urlshortener/v1/url?key=" + token;
	var send_option = {
		url : set_url,
		headers:{
			'Content-Type': 'application/json'
		},
		json : true,
		body :{
            longUrl: in_url
        }
	};
	request.post(send_option,function(error, response, body){
		if (!error && response.statusCode == 200) {
			console.log('OK: '+ response.statusCode);
			callback(body);
		}
		else{
			console.log('error: '+ response.statusCode);
		}
	});
}
