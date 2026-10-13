// This is a JavaScript file
var select_flg = false; // 選択肢用フラグ
var game = null; // Gameオブジェクト
var q_label = []; // 問題のラベル
var score_num = 0; // スコア
var score_data = []; // スコアデータ
var score_label = null; // スコアラベル
var choice_sprite = []; // 選択肢スプライト
var choice_label = []; // 選択肢ラベル
var answer_sprite = null; // 回答オブジェクト
var answer_label = null;
var count = 0; // 現在の質問番号
var end_point = 5; // 終了番号
var current_data = null; // 現在の問題データ
var q_num_array = null; // 質問の番号データ
var CheckIt = {'good':null, 'bad':null };
var ResultIt = {'bad':null, 'good':null, 'excellent':null };

/* ここからプログラム */
// @ts-nocheck 


// 選択肢の位置計算
function ChoicePos(n) { // ☆
	return {
		'x':70,
		'y':758 + 80 * n
	};
};

// 正解の位置計算
function AnswerPos(n) { // ☆
	return {
		'x':ChoicePos(n).x - 16,
		'y':ChoicePos(n).y - 16
	};
};

// 
function createRndArray(num) {
  var arr = [];
  for (var i = 0;i < num;i++){
  	arr[i] = i + 1;
  }
  for(var i = 0;i < num * 100;i++){
  	var a = Math.floor(Math.random() * num);
  	var b = Math.floor(Math.random() * num);
  	var bk = arr[a];
  	arr[a] = arr[b];
  	arr[b] = bk;
  }
  return arr;
}

enchant();

// 初期化処理
function startNow(){
	var div = document.getElementById('msg');
	document.body.removeChild(div);
	
	game = new Game(720, 1280); // ☆
	game.fps = 10;
	
	game.preload('img/background.png');
	game.preload('img/answer.png');
	game.preload('img/correct.png');
	game.preload('img/incorrect.png');
	game.preload('img/choice1.png');
	game.preload('img/choice2.png');
	game.preload('img/choice3.png');
	game.preload('img/choice4.png');
	game.preload('img/result_bad.png');
	game.preload('img/result_good.png');
	game.preload('img/result_excellent.png');
	
	q_num_array = createRndArray(data_max);
	
	game.onload = function(){
		// 背景作成
		bg_image = new Sprite(720, 1280); // ☆
		bg_image.image = game.assets['img/background.png'];
		bg_image.moveTo(0, 0);
		game.rootScene.addChild(bg_image);
		
		// 問題ラベル
		for(var i = 0;i < 3;i++){
			q_label[i] = new Label('');
			q_label[i].color = 'white';
			q_label[i].font = 'normal normal 40pt/40pt San Serif';
			q_label[i].width = 600;
			q_label[i].moveTo(80, 400 + 80 * i); // ☆
			game.rootScene.addChild(q_label[i]);
		}
		
		// 選択肢スプライト
		for (var i = 0;i < 4;i++){
			var sp = new Sprite(576, 64); // ☆
			sp.image = game.assets['img/choice' + (i + 1) + '.png'];
			sp.moveTo(ChoicePos(i).x, ChoicePos(i).y);
			sp.addEventListener(enchant.Event.TOUCH_START, checkAnswer);
			sp.opacity = 1.0; // 半透明化
			sp.number = i;
			choice_sprite[i] = sp;
			game.rootScene.addChild(sp);
			
			var lb = new Label('ANSWER ' + i);
			lb.color = '#666';
			lb.font = '40pt San Serif';
			lb.width = 500;
			lb.number = i;
			lb.moveTo(ChoicePos(i).x + 70, ChoicePos(i).y + 5);
			lb.addEventListener(enchant.Event.TOUCH_START, checkAnswer);
			choice_label[i] = lb;
			game.rootScene.addChild(lb);
		}
		
		// 回答スプライト
		answer_sprite = new Group();
		answer_sprite.moveTo(AnswerPos(0).x, AnswerPos(0).y);
		ans_sp = new Sprite(608, 96); // ☆
		ans_sp.image = game.assets['img/answer.png'];
		ans_sp.moveTo(0, 0);
		answer_sprite.addChild(ans_sp);
		answer_label = new Label('ANSWER!!');
		answer_label.color = '#666';
		answer_label.font = '40pt San Serif';
		answer_label.width = 500;
		answer_label.moveTo(85, 18); // ☆
		answer_sprite.addChild(answer_label);
		answer_sprite.moveTo(-1000, -1000);
		game.rootScene.addChild(answer_sprite);
		
		// スコアラベル
		score_label = new Label('0');
		score_label.color = 'white';
		score_label.font = 'bold 40pt San Serif';
		score_label.textAlign = 'right';
		score_label.width = 500;
		score_label.moveTo(150, 1180); // ☆
		game.rootScene.addChild(score_label);
		
		// ○×表示
		var gd_gp = new Group();
		var gd_sp = new Sprite(400, 400); // ☆
		gd_sp.image = game.assets['img/correct.png'];
		gd_sp.moveTo(160, 170); // ☆
		gd_gp.addEventListener(enchant.Event.TOUCH_START, setNextQ);
		gd_gp.moveTo(-1000, -1000);
		gd_gp.addChild(gd_sp);
		CheckIt.good = gd_gp;
		game.rootScene.addChild(CheckIt.good);
		
		var bd_gp = new Group();
		var bd_sp = new Sprite(400, 400); // ☆
		bd_sp.image = game.assets['img/incorrect.png'];
		bd_sp.moveTo(160, 170); // ☆
		bd_gp.addEventListener(enchant.Event.TOUCH_START, setNextQ);
		bd_gp.moveTo(-1000, -1000);
		bd_gp.addChild(bd_sp);
		CheckIt.bad = bd_gp;
		game.rootScene.addChild(CheckIt.bad);
		
		// ゲーム評価の作成
		var res_bad_gp = new Group();
		var res_bad_sp = new Sprite(720, 649); // ☆
		res_bad_sp.image = game.assets['img/result_bad.png'];
		res_bad_sp.moveTo(0, 300); // ☆
		res_bad_gp.addChild(res_bad_sp);
		res_bad_gp.moveTo(-1000, -1000);
		ResultIt.bad = res_bad_gp;
		game.rootScene.addChild(ResultIt.bad);
		
		var res_good_gp = new Group();
		var res_good_sp = new Sprite(720, 649); // ☆
		res_good_sp.image = game.assets['img/result_good.png'];
		res_good_sp.moveTo(0, 300); // ☆
		res_good_gp.addChild(res_good_sp);
		res_good_gp.moveTo(-1000, -1000);
		ResultIt.good = res_good_gp;
		game.rootScene.addChild(ResultIt.good);
		
		var res_ex_gp = new Group();
		var res_ex_sp = new Sprite(720, 649); // ☆
		res_ex_sp.image = game.assets['img/result_excellent.png'];
		res_ex_sp.moveTo(0, 300); // ☆
		res_ex_gp.addChild(res_ex_sp);
		res_ex_gp.moveTo(-1000, -1000);
		ResultIt.excellent = res_ex_gp;
		game.rootScene.addChild(ResultIt.excellent);
		
		// 最初の問題の準備
		setNewData();
	};
	
	game.start();
	
}

// 問題データの取得
function setNewData(){
	var transaction = idb.transaction(['quiz_data'],'readonly');
	var store = transaction.objectStore('quiz_data');
	var current = q_num_array[count];
	var request = store.get(current);
	request.onsuccess = function(event){
		current_data = request.result;
		setChoice();
		setQLabel();
	};
	request.onerror = function(event){
		alert("ERROR: " + event);
	}
}

// 次の質問の用意
function setNextQ(){
	CheckIt.good.moveTo(-1000, -1000);
	CheckIt.bad.moveTo(-1000, -1000);
	answer_sprite.moveTo(-1000, -1000);
	count++;
	if (count == end_point){ // 終了時
		gameEnd();
		return;
	}
	setNewData();
}

// 問題の設定
function setQLabel(){
	var qstr = current_data.Q;
	for(var i = 0;i < 3;i++){
		var s = qstr.substr(10 * i, 10);
		q_label[i].text = s;
	}
}

// 選択肢の設定
function setChoice(){
	for(var i = 0;i < 4;i++){
		choice_label[i].text = current_data.C[i];
		choice_label[i].opacity = 1.0;
		choice_sprite[i].opacity = 1.0;
	}
	select_flg = true;
}

// 回答スプライトの設定
function setAnswer(n){
	for(var i = 0;i < 4;i++){
		choice_label[i].opacity = 0.5;
		choice_sprite[i].opacity = 0.5;
	}
	var ans = current_data.A;
	answer_label.text = current_data.C[ans];
	answer_sprite.moveTo(AnswerPos(n).x, AnswerPos(n).y);
	select_flg = false;
}

// 回答処理
function checkAnswer(event){
	if (!select_flg){ return; }
	var sel = event.target.number;
	setAnswer(current_data.A);
	if (sel == current_data.A){
		score_data[count] = true;
		CheckIt.good.moveTo(0, 0);
		CheckIt.bad.moveTo(-1000, -1000);
		score_num += current_data.P;
		score_label.text = score_num;
	} else {
		score_data[count] = false;
		CheckIt.good.moveTo(-1000, -1000);
		CheckIt.bad.moveTo(0, 0);
	}
}

// 終了処理
function gameEnd(){
	var t = 0;
	var f = 0;
	for(var i = 0;i < end_point;i++){
		if (score_data[i]){
			t++;
		} else {
			f++;
		}
	}
	var x = Math.floor(t / (t + f) * 2);
	switch(x){
	case 0:
		ResultIt.bad.moveTo(0, 0);
		break;
	case 1:
		ResultIt.good.moveTo(0, 0);
		break;
	case 2:
		ResultIt.excellent.moveTo(0, 0);
		break;
	}
	game.stop();

	// リンク生成
	var dv = document.createElement('div');
	dv.style.position = 'absolute';
	dv.style.width = '100%';
	dv.style.height = '100%';
	dv.onclick = function(){ window.location.href="../index.html"; };
	document.body.appendChild(dv);
}

