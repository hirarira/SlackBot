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

controller.hears(['こんちは','こんにちは'],'direct_message,direct_mention,mention',function(bot, message) {
	getSlackUser(bot,message,function(UserProf){
		var out_str = "こんにちは！";
		if(UserProf.real_name != undefined){
			out_str += UserProf.real_name;
		}
		else if(UserProf.name != undefined){
			out_str += UserProf.name;
		}
		out_str += "さん";
		bot.reply(message,out_str);
	});
});
// 指定したIDのユーザ情報を取得できる。コールバック関数なので注意！
// 引数は(bot,message,callback)の形
function getSlackUser(bot,message,callback){
	// Botのアクセストークン取得
	var token = bot.config.token;
	var user_id = message.user;
	// HTTPリクエスト
	var request = require('request');
	var in_url = "https://slack.com/api/users.list?token=" + token;
	var send_option = {
		url: in_url,
		json: true
	};
	request.get(send_option, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log('OK: '+ response.statusCode);
			if(body.ok){
				var members = body.members;
				for(var i=0;i<members.length;i++){
					if(members[i].id == user_id){
						callback(members[i]);
					}
				}
			}
			else{
				console.log('error:'+body.error);
			}
		}
		else{
			console.log('error: '+ response.statusCode);
		}
	});
}
