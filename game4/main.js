// This is a JavaScript file
// @ts-nocheck 
var game_flg = true; // ゲーム中かどうか示す値
var game = null; // Gameオブジェクト
var player = null; // プレーヤーのスプライト
var score = null; // スコアのラベル
var score_point = 0; // スコアの点数
var bg_image = null; // 背景のイメージ
var sprite_size = 100; // スプライトの大きさ
var play_time = 70000; // プレイ時間（ミリ秒数）
var default_accel = {x:0, y:0}; // 基準値
var stay_here = {'x':0, 'y':0 }; // 現在位置
var player_move = {x:0, y:0, dy:0}; // 移動速度
var accelerate = {x:0, y:0}; // センサー値
var parts_array = []; // パーツをすべて保管する配列
var cloud_data = []; // 雲の保管用配列
var ladder_data = []; // ハシゴの保管用配列
var trampoline = null; // トランポリン
var watch_id = null; // センサーID
var zero = {'x':10, 'y':20}; // ゼロ地点

var walk = { // 歩くframeプロパティ値
	'stop':[8, 8, 8, 8, 8, 8, 9, 9,9, 9, 9, 9],
	'down':[0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
	'right':[2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
	'left':[4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
	'up':[6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7]
};

var cloud_set = [ // 雲のデータ
	{'img':'img/cloud_100x50.png','w':100, 'h':50},
	{'img':'img/cloud_200x50.png','w':200, 'h':50},
	{'img':'img/cloud_300x50.png','w':300, 'h':50}
];

var ladder_set = [ // ハシゴのデータ
	{'img':'img/ladder_100x100.png','w':100, 'h':100},
	{'img':'img/ladder_100x200.png','w':100, 'h':200},
	{'img':'img/ladder_100x300.png','w':100, 'h':300}
];

// これよりプログラム =========================
// @ts-nocheck 
enchant();

function startNow(){
	var div = document.getElementById('msg');
	document.body.removeChild(div);
	
	// ゲーム盤の作成
	game = new Core(720, 1280);
	game.preload('img/background.png');
	game.preload('img/character.png');
	game.preload('img/cloud_100x50.png');
	game.preload('img/cloud_200x50.png');
	game.preload('img/cloud_300x50.png');
	game.preload('img/ladder_100x100.png');
	game.preload('img/ladder_100x200.png');
	game.preload('img/ladder_300x100.png');
	game.preload('img/trampoline_100x50.png');
	game.fps = 30;
	
	game.onload = function(){
		// 背景作成
		bg_image = new Sprite(720, 1280);
		bg_image.image = game.assets['img/background.png'];
		bg_image.moveTo(0, 0);
		game.rootScene.addChild(bg_image);
		
		createBoard();
		
		// プレーヤー作成
		player = new Sprite(sprite_size, sprite_size);
		player.image = game.assets['img/character.png'];
		player.frame = walk.stop;
		player.moveTo(zero.x + sprite_size * 3, zero.y + sprite_size * 9);
		game.rootScene.addChild(player);
		
		// スコア作成
		score = new Label('SCORE: 0');
		score.color = 'red';
		score.font = 'bold 32pt Times';
		score.width = 500;
		score.moveTo(20, 20);
		game.rootScene.addChild(score);
		
		// イベントの組み込み
		player.addEventListener(enchant.Event.ENTER_FRAME, function(event){
			move_sprite();
		});
		
	};
	
	// ゲームの開始
	game.start();
	
	setDefaultAccel();
	
};

// 盤面を作る
function createBoard(){
	for(var i = 0;i < board_data[i].length;i++){
		for(var j =0;j < board_data.length;j++){
			var num = board_data[j][i];
			var sp_data = null;
			switch(num){
			case 1:
				var c = 0;
				try {
					if (board_data[j][i-1] != 1){
						if (board_data[j][i+1] == 1){ c++; }
						if (board_data[j][i+2] == 1){ c++; }
					}
				} catch(e){}
				sp_data = cloud_set[c];
				break;
			case -1:
				var c = 0;
				try {
					if (board_data[j-1][i] != -1){
						if (board_data[j][i+1] == -1){ c++; }
						if (board_data[j][i+2] == -1){ c++; }
					}
				} catch(e){}
				sp_data = ladder_set[c];
				break;
			case 2:
				sp_data = {'img':'img/trampoline_100x50.png','w':100, 'h':50};
				break;
			}
			if (sp_data != null){
				var sp = new Sprite(sp_data.w, sp_data.h);
				sp.image = game.assets[sp_data.img];
				sp.moveTo(zero.x + i * sprite_size, zero.y + j * sprite_size);
				game.rootScene.addChild(sp);
				parts_array.push(sp);
			}
		}
	}
}

// 【修正版】センサーの監視を開始する（index.htmlのTOUCH to STARTから呼び出されます）
function setDefaultAccel() {
    // ブラウザ標準の傾き（DeviceOrientation）イベントを登録
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', onOrientationChange, false);
    } else {
        alert("お使いのブラウザは傾きセンサーに対応していません。");
    }
}

// 【修正版】センサー処理（スマホの傾きを検知してプレイヤーの移動量に変換）
function onOrientationChange(event) {
    // event.gamma: 左右の傾き（左がマイナス、右がプラス）
    // event.beta: 前後の傾き（手前がプラス、奥がマイナス）
    var gamma = event.gamma;
    var beta = event.beta;

    // センサー値が取得できない場合は処理しない
    if (gamma === null || beta === null) return;

    var frm = walk.stop;
    player_move.x = 0;
    player_move.y = 0;

    // 左右の傾き判定（傾きの強さに応じて値を調整してください。ここでは±5度を基準にしています）
    if (gamma > 5) {
        frm = walk.right;
        player_move.x += 5;
    } else if (gamma < -5) {
        frm = walk.left;
        player_move.x -= 5;
    }

    // 前後の傾き判定（手前・奥の傾き±5度を基準にしています）
    if (beta > 5) {
        // スマホを手前に傾けたら下へ（ゲームの仕様に合わせて調整してください）
        frm = walk.down;
        player_move.y += 5;
    } else if (beta < -5) {
        // スマホを奥に傾けたら上へ
        frm = walk.up;
        player_move.y -= 5;
    }

    player.frame = frm;
}


// スプライト（プレーヤー）を動かす
function move_sprite(){
	var res = checkFalling();
	var here = 0;
	try {
		here = board_data[stay_here.y][stay_here.x];
	} catch(e){}
	stay_here.x = stay_here.x >= board_data[0].length ? 
		board_data[0].length - 1 : stay_here.x;
	stay_here.x = stay_here.x < 0 ? 0 : stay_here.x;
	player.x = player.x < 0 ? 0 : player.x;
	player.x = player.x > (720 - sprite_size) ? 720 - sprite_size : player.x;
	
	if (here == 0 && player.y <= stay_here.y * sprite_size + zero.y)
		{ player_move.y = 0; }
	switch(res){
	case 0: // 空白
		if (here == 0){
			player.x += player_move.x / 2;
		}
		if (here == -1){
			player.y += player_move.y;
		} else {
			player.y += player_move.dy++;
		}
		break;
	case 1:	// 雲
		player_move.dy = 0;
		player.x += player_move.x;
		if (here == -1){
			player.y += player_move.y;
		}
		break;
	case -1: // ハシゴ
		player_move.dy = 0;
		player.x += player_move.x;
		player.y += player_move.y;
		break;
	case 2: // トランポリン
		player_move.dy = -20; // ジャンプの勢い
		player.y += player_move.dy--;
		break;
	}
	update_score();
	checkEnd();
}

// 落下のチェック
function checkFalling(){
	var x = Math.floor((player.x - zero.x + sprite_size / 2) / sprite_size);
	var y = Math.floor((player.y - zero.y) / sprite_size);
	var res = 0;
	try {
		res = board_data[y + 1][x];
	} catch(e){}
	if (res != 0){
		if (stay_here.x != x || stay_here.y != y){
			score_point += 100;
			if (res == 2){ score_point += 300; }
		}
	}
	if (res == 1){ player.y = y * sprite_size + zero.y; }
	stay_here.x = x;
	stay_here.y = y;
	return res;
}

// スコアの更新
function update_score(){
	score.text = 'SCORE: ' + score_point;	
}

// ゲームの終了
function checkEnd(){
	if (player.y < 0 || player.y > 1280){
		var msg1 = new Label('GAME OVER');
		msg1.color = 'black';
		msg1.font = 'bold 70pt Times';
		msg1.width = 800;
		msg1.moveTo(105, 405);
		game.rootScene.addChild(msg1);
		var msg2 = new Label('GAME OVER');
		msg2.color = 'magenta';
		msg2.font = 'bold 70pt Times';
		msg2.width = 800;
		msg2.moveTo(100, 400);
		game.rootScene.addChild(msg2);
		navigator.accelerometer.clearWatch(watch_id);
		game.stop();

		// リンク生成
		var dv = document.createElement('div');
		dv.style.position = 'absolute';
		dv.style.width = '100%';
		dv.style.height = '100%';
		dv.onclick = function(){ window.location.href="../index.html"; };
		document.body.appendChild(dv);
	}
}
