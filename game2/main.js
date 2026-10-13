// This is a JavaScript file
var sprite_size = 200; // スプライトの大きさ
var player_pos = {'x':2, 'y':2}; // プレーヤーの位置
var map_pos = {'x':0, 'y':0}; // マップの表示位置

var game = null; // Gameオブジェクト
var stage = null; // Groupオブジェクト
var map = null; // Mapオブジェクト
var player = null; // プレヤーのSpriteオブジェクト
var attack_effect = null; // 攻撃効果のSpriteオブジェクト
var attack_effect2 = null; // 攻撃効果のSpriteオブジェクト
var item_get_effect = null; // アイテムゲット効果のSpriteオブジェクト
var hitpoint_label = null; // パワー表示用のLabelオブジェクト
var status_label = null; // ステータス表示用のLabelオブジェクト
var enemy_array = null; // 配置されている敵キャラのSprite配列
var item_array = null; // 配置されているアイテムのSprite配列
var is_anim = false; // アニメーション中かどうかチェックする

var level = 0; // 現在のレベル
var player_state = { // プレーヤーのステータス
	'hitpoint':100,
	'attack':10,
	'defence':5
};

var walk = { // 歩くframeプロパティ値
	'stop':[0],
	'down':[0, 0, 0, 0, 1, 1, 1, 1],
	'right':[2, 2, 2, 2, 3, 3, 3, 3],
	'left':[4, 4, 4, 4, 5, 5, 5, 5],
	'up':[6, 6, 6, 6, 7, 7, 7, 7]
};
var enemy_img = [ // 敵キャラのイメージ値
	'img/enemyA.png',
	'img/enemyB.png',
	'img/enemyC.png'
];

/* ここからプログラム */
// @ts-nocheck
enchant();

// 初期化処理
function startNow(){
	var div = document.getElementById('msg');
	document.body.removeChild(div);
	
	game = new Core(sprite_size * 5, sprite_size * 5);
	game.fps = 30;
	
	game.preload('img/map.png');
	game.preload('img/character.png');
	game.preload('img/enemyA.png');
	game.preload('img/enemyB.png');
	game.preload('img/enemyC.png');
	game.preload('img/item_life.png');
	game.preload('img/ef_atack.png');
	game.preload('img/ef_itemGet.png');
	
	game.onload = function(){
		createNewLevel();
	};
	
	game.start();
}

// 新しいレベルの生成
function createNewLevel(){
	map_pos = {'x':0, 'y':0};
	
	var scene = new Scene();
	
	// Groupの作成
	stage = new Group();
	stage.moveTo(0, 0);
	scene.addChild(stage);
	
	// Mapの作成
	map = new Map(sprite_size, sprite_size);
	map.image = game.assets['img/map.png'];
	map.loadData(floor_data[level]);
	map.collisionData = collision_data[level];
	map.moveTo(0, 0);
	stage.addChild(map);
	
	// プレーヤーの作成
	player = new Sprite(sprite_size, sprite_size);
	player.image = game.assets['img/character.png'];
	player.frame = walk.stop;
	player.moveTo(sprite_size * 2, sprite_size * 2);
	scene.addChild(player);
	
	// 敵キャラの作成
	makeEnemy();
	
	// アイテムの作成
	makeItem();

	// 攻撃効果の作成
	attack_effect = new Sprite(sprite_size, sprite_size);
	attack_effect.image = game.assets['img/ef_atack.png'];
	attack_effect.moveTo(-1000, -1000);
	attack_effect.tl.hide();
	scene.addChild(attack_effect);
	attack_effect2 = new Sprite(sprite_size, sprite_size);
	attack_effect2.image = game.assets['img/ef_atack.png'];
	attack_effect2.moveTo(-1000, -1000);
	attack_effect2.tl.hide();
	scene.addChild(attack_effect2);
	
	// アイテムGET効果の作成
	item_get_effect = new Sprite(sprite_size, sprite_size);
	item_get_effect.image = game.assets['img/ef_itemGet.png'];
	item_get_effect.moveTo(sprite_size * 2, sprite_size * 2);
	item_get_effect.tl.hide();
	scene.addChild(item_get_effect);
	
	// ラベルの作成
	hitpoint_label = new Label();
	hitpoint_label.color = 'white';
	hitpoint_label.font = 'bold 48pt Times';
	hitpoint_label.width = 500;
	hitpoint_label.moveTo(20, 20);
	scene.addChild(hitpoint_label);
	
	status_label = new Label();
	status_label.color = 'white';
	status_label.font = '48pt Times';
	status_label.width = 500;
	status_label.moveTo(300, 20);
	scene.addChild(status_label);
	
	// ラベルの表示更新
	updateLabel();
	
	// イベントの組み込み
	scene.addEventListener(enchant.Event.TOUCH_START, function(event){
		clickToMove(event);
	});
	
	// シーンの設定
	game.pushScene(scene);
	
};

// クリックイベントの処理
function clickToMove(event){
	if (is_anim){ return; }
	var dx = {'x':0, 'y':0};
	
	if (event.x > game.width * 3 / 4){
		if (player_pos.x + 1 < 10){
			player.frame = walk.right;
			dx.x++;
		}
	}
	if (event.x < game.width * 1 / 4){
		if (player_pos.x - 1 > -1){
			player.frame = walk.left;
			dx.x--;
		}
	}
	if (dx.x == 0){
		if (event.y > game.height * 3 / 4){
			if (player_pos.y + 1 < 10){
				player.frame = walk.down;
				dx.y++;
			}
		}
		if (event.y < game.height * 1 / 4){
			if (player_pos.y - 1 > -1){
				player.frame = walk.up;
				dx.y--;
			}
		}
	}
	
	// 移動先が通過可能かチェックする
	if (!map.hitTest((player_pos.x + dx.x) * sprite_size, (player_pos.y + dx.y) * sprite_size)){
		// 移動先に敵キャラがいた場合の処理
		if (!checkEnemy(dx)){
			player_pos.x += dx.x;
			player_pos.y += dx.y;
			map_pos.x += dx.x;
			map_pos.y  += dx.y;
			is_anim = true;
			stage.tl.moveBy(dx.x * -1 * sprite_size, dx.y * -1 * sprite_size, 5).delay(5).exec(function(){ is_anim = false; });
			if (floor_data[level][player_pos.y][player_pos.x] == 6){
				levelUp();
				return;
			}
		}
	}
	enemyMove();
	checkItem();
}

// 次のレベルへ
function levelUp(){
	level++;
	if (level >= floor_data.length){
		gameClear();
	}
	player_pos = {'x':2, 'y':2};
	map.tl.fadeOut(20).exec(createNewLevel);
}

// 敵キャラの作成
function makeEnemy(){
	enemy_array = [];
	for(var i = 0;i < enemy_data[level].length;i++){
		var arr = enemy_data[level][i];
		var enemy = new Sprite(sprite_size, sprite_size);
		enemy_array[i] = enemy;
		enemy.image = game.assets[enemy_img[arr.type]];
		enemy.moveTo(arr.x * sprite_size, arr.y * sprite_size);
		enemy.frame = player.x > arr.x * sprite_size ? walk.right : walk.left;
		stage.addChild(enemy);
	}
}

// 敵キャラの移動
function enemyMove(){
	for(var i = 0;i < enemy_data[level].length;i++){
		var dx = {'number':i, 'x':0, 'y':0};
		if (enemy_data[level][i].x < player_pos.x){
			enemy_array[i].frame = walk.right;
			dx.x++;
		}
		if (enemy_data[level][i].x > player_pos.x){
			enemy_array[i].frame = walk.left;
			dx.x--;
		}
		if (enemy_data[level][i].y < player_pos.y){
			enemy_array[i].frame = walk.down;
			dx.y++;
		}
		if (enemy_data[level][i].y > player_pos.y){
			enemy_array[i].frame = walk.up;
			dx.y--;
		}
		
		if (!map.hitTest((enemy_data[level][i].x + dx.x) * sprite_size, (enemy_data[level][i].y + dx.y) * sprite_size)){
			var nx = enemy_data[level][i].x + dx.x;
			var ny = enemy_data[level][i].y + dx.y;
			if (nx == player_pos.x && ny == player_pos.y){
				attackToPlayer(dx);
			} else {
				enemy_data[level][i].x += dx.x;
				enemy_data[level][i].y += dx.y;
				enemy_array[i].tl.moveBy(dx.x * sprite_size, dx.y * sprite_size, 10);
			}
		}
	}
}

// 敵キャラとの衝突チェック
function checkEnemy(dx){
	var flg = false;
	for(var i = 0;i < enemy_data[level].length;i++){
		if (enemy_data[level][i].x == player_pos.x + dx.x && enemy_data[level][i].y == player_pos.y + dx.y){
			flg = true;
			attackToEnemy(i);
		}
	}
	return flg;
}

// 敵キャラへの攻撃
function attackToEnemy(n){
	attack_effect.moveTo((enemy_data[level][n].x - map_pos.x) * sprite_size, (enemy_data[level][n].y - map_pos.y) * sprite_size);
	attack_effect.tl.show().fadeOut(5).hide();
	var d = player_state.attack - enemy_data[level][n].defence;
	if (d > 0){
		enemy_data[level][n].hitpoint -= d;
	}
	if(enemy_data[level][n].hitpoint <= 0){
		enemy_array[n].tl.clear().removeFromScene();
		enemy_data[level].splice(n, 1);
		enemy_array.splice(n, 1);
	}
}

// プレーヤーへの攻撃
function attackToPlayer(dx){
	var enmy = enemy_data[level][dx.number];
	if (enmy.x + dx.x == player_pos.x && enmy.y + dx.y == player_pos.y){
		attack_effect2.moveTo(sprite_size * 2, sprite_size * 2);
		attack_effect2.tl.show().fadeOut(5).hide();
		var d = enmy.attack - player_state.defence;
		if (d >= 0){
			player_state.hitpoint -= d;
			updateLabel();
		}
		if (player_state.hitpoint <= 0){ // ★GAME OVER
			game.stop();
			alert("GAME OVER");
			
			// リンク生成
			var dv = document.createElement('div');
			dv.style.position = 'absolute';
			dv.style.width = '100%';
			dv.style.height = '100%';
			dv.onclick = function(){ window.location.href="../index.html"; };
			document.body.appendChild(dv);
			return;
		}
	}
}

// アイテムの作成
function makeItem(){
	item_array = [];
	for(var i = 0;i < item_data[level].length;i++){
		var arr = item_data[level][i];
		var itm = new Sprite(sprite_size, sprite_size);
		item_array[i] = itm;
		itm.image = game.assets['img/item_life.png'];
		itm.moveTo(arr.x * sprite_size, arr.y * sprite_size);
		stage.addChild(itm);
	}
}

// アイテムGETのチェック
function checkItem(){
	for(var i = 0;i < item_data[level].length;i++){
		var itm = item_data[level][i];
		if (player_pos.x == itm.x && player_pos.y == itm.y){
			player_state.hitpoint += itm.hitpoint;
			player_state.attack += itm.attack;
			player_state.defence += itm.defence;
			item_array[i].tl.clear().removeFromScene();
			item_array.splice(i, 1);
			item_data[level].splice(i, 1);
			hitpoint_label.text = player_state.hitpoint;
			updateLabel();
			item_get_effect.tl.clear().show().fadeOut(20).hide();
		}
	}
}

// ラベルの更新
function updateLabel(){
	hitpoint_label.text = "HP " + player_state.hitpoint;
	status_label.text = 'ATK ' + player_state.attack + ' DEF ' + player_state.defence;

}

// クリアの処理
function gameClear(){
	var msg_label = new Label('CLEAR!');
	msg_label.color = 'red';
	msg_label.font = 'bold 128pt Times';
	msg_label.width = 1000;
	msg_label.moveTo(200, 400);
	game.currentScene.addChild(msg_label);
	game.stop();

	// リンク生成
	var dv = document.createElement('div');
	dv.style.position = 'absolute';
	dv.style.width = '100%';
	dv.style.height = '100%';
	dv.onclick = function(){ window.location.href="../index.html"; };
	document.body.appendChild(dv);
}


