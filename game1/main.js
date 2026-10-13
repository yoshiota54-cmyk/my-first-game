// This is a JavaScript file

var game_flg = true; // ゲーム中かどうか示す値
var game = null; // Gameオブジェクト
var player = null; // プレーヤーのスプライト
var effect = null; // 効果のスプライト
var score = null; // スコアのラベル
var score_point = 0; // スコアの点数
var bg_image = null; // 背景のイメージ
var sprite_size = 200; // スプライトの大きさ
var horizon = 200; // 水平位置
play_time = 70000; // プレイ時間（ミリ秒数）
var move_point = 0; // 移動先（プログラムが使用）
var move_dx = 10; // フレームごとの移動幅
var interval_time = 10000; // 敵キャラの出現間隔
var enemy_data = []; // 敵キャラの保管用配列
var item_data = []; // アイテムの保管用配列

var walk = { // 歩くframeプロパティ値
	'stop':[0, 0, 1, 1],
	'right':[2, 2, 3, 3],
	'left':[4, 4, 5, 5]
};
var enemy_img = [ // 敵キャラのイメージ値
	'img/enemyA.png',
	'img/enemyB.png',
	'img/enemyC.png'
];
var touch_flg = false; // 自キャラをタッチしたか否か
var touch_dx = 0; // 自キャラタッチ時のジャンプ幅

// これよりプログラム
// @ts-nocheck
enchant();

function startNow(){
	var div = document.getElementById('msg');
	document.body.removeChild(div);
	
	// ゲーム盤の作成
	game = new Game(1280, 720);
	game.preload('img/background.png');
	game.preload('img/character.png');
	game.preload('img/enemyA.png');
	game.preload('img/enemyB.png');
	game.preload('img/enemyC.png');
	game.preload('img/item.png');
	game.preload('img/ef_itemGet.png');
	game.fps = 10;
	
	game.onload = function(){
		// 背景作成
		bg_image = new Sprite(1280, 720);
		bg_image.image = game.assets['img/background.png'];
		bg_image.moveTo(0, 0);
		game.rootScene.addChild(bg_image);	
		
		// プレーヤー作成
		player = new Sprite(sprite_size, sprite_size);
		player.image = game.assets['img/character.png'];
		player.frame = [0, 1];
		player.moveTo(100, horizon);
		game.rootScene.addChild(player);
		
		// 効果作成
		effect = new Sprite(sprite_size, sprite_size);
		effect.image = game.assets['img/ef_itemGet.png'];
		effect.moveTo(-200, -200);
		effect.tl.hide();
		game.rootScene.addChild(effect);
		
		// スコア作成
		score = new Label('SCORE: 0');
		score.color = 'red';
		score.font = 'bold 48pt Times';
		score.width = 500;
		score.moveTo(50, horizon + 300);
		game.rootScene.addChild(score);
		
		move_point = player.x;
		
		// イベントの組み込み
		game.rootScene.addEventListener(enchant.Event.TOUCH_START, function(event){
			touch_scene(event);
		});
		
		player.addEventListener(enchant.Event.TOUCH_START, function(event){
			touch_player(event);
			
		});
		player.addEventListener(enchant.Event.ENTER_FRAME, function(event){
			move_sprite(event);
			checkEnemy();
			checkItem();
		});
		
	};
	
	// ゲームの開始
	game.start();
	setTimeout(makeEnemy, 1000);
	setTimeout(makeItem, 10000 + Math.floor(Math.random() * 10) * 1000);
	setTimeout(gameEnd, play_time);
	
};

// シーンをタッチ
function touch_scene(event){
	move_point = event.x - sprite_size / 2;
	if (move_point > player.x){
		player.frame = walk.right;
	} else {
		player.frame = walk.left;
	}
}

// プレーヤーをタッチ
function touch_player(envet){
	touch_flg = true;
	touch_dx = -25;
}

// スプライト（プレーヤー）を動かす
function move_sprite(event){
	if (Math.abs(move_point - player.x) <= move_dx){
		player.frame = walk.stop;
	}
	if (move_point - player.x >= move_dx){
		player.x += move_dx;
	}
	if (player.x - move_point >= move_dx){
		player.x -= move_dx;
	}
	if (touch_flg){
		player.y += touch_dx;
		touch_dx += 2;
		if (player.y < sprite_size / 2 * -1){
			player.y = sprite_size / 2 * -1;
		}
		if (player.y > horizon){
			player.y = horizon;
			touch_flg = false;
			touch_dx = 0;
		}
	}
}

// 敵キャラの作成
function makeEnemy(){
	var enemy = new Sprite(sprite_size, sprite_size);
	enemy_data.push(enemy);
	var img_num = Math.floor(Math.random() * 3);
	enemy.image = game.assets[enemy_img[img_num]];
	var x = Math.floor(Math.random() * game.width - sprite_size);
	enemy.moveTo(x, horizon);
	enemy.frame = player.x > x ? walk.right : walk.left;
	game.rootScene.addChild(enemy);
	enemy.tl.moveTo(player.x, horizon, 100).removeFromScene();
	if (game_flg){
		interval_time -= interval_time / 10;
		setTimeout(makeEnemy, interval_time);
	}
}

// 敵キャラの衝突チェック
function checkEnemy(){
	for(var i = 0;i < enemy_data.length;i++){
		if (player.within(enemy_data[i], 180)){
			if (touch_dx > 0){
				effect.x = enemy_data[i].x;
				effect.y = enemy_data[i].y;
				effect.tl.clear().show().fadeOut(10).hide();
				update_score(100);
			} else {
				update_score(-10);
			}
			enemy_data[i].tl.clear().removeFromScene();
			enemy_data.splice(i, 1);
			return;
		}
	}
}

// アイテムの作成
function makeItem(){
	var pitem = new Sprite(sprite_size, sprite_size);
	item_data.push(pitem);
	pitem.image = game.assets['img/item.png'];
	pitem.frame = [0];
	pitem.scaleX = 0.75;
	pitem.scaleY = 0.75;
	var x = Math.floor(Math.random() * (game.width - sprite_size));
	var y = horizon -  Math.floor(Math.random() * sprite_size);
	pitem.moveTo(x, y);
	game.rootScene.addChild(pitem);
	pitem.tl.moveBy(0, 0, 100).removeFromScene();
	if (game_flg){
		setTimeout(makeItem, 5000 + Math.floor(Math.random() * 10) * 1000);
	}
}

// アイテムGETのチェック
function checkItem(){
	for(var i = 0;i < item_data.length;i++){
		if (player.within(item_data[i], 100)){
			item_data[i].tl.clear().removeFromScene();
			update_score(300);
			effect.x = item_data[i].x;
			effect.y = item_data[i].y;
			item_data.splice(i, 1);
			effect.tl.clear().show().fadeOut(20).hide();
		}
	}
}

// スコアの更新
function update_score(n){
	score_point += n;
	score_point = score_point < 0 ? 0 : score_point;
	score.text = 'SCORE: ' + score_point;	
}

// ゲームの終了
function gameEnd(){
	game_flg = false;
	game.stop();
	var msg = new Label('GAME OVER');
	msg.color = 'red';
	msg.font = 'bold 96pt Times';
	msg.width = 800;
	msg.moveTo(50, 50);
	game.rootScene.addChild(msg);
	
	// リンク生成
	var dv = document.createElement('div');
	dv.style.position = 'absolute';
	dv.style.width = '100%';
	dv.style.height = '100%';
	dv.onclick = function(){ window.location.href="../index.html"; };
	document.body.appendChild(dv);
}




