// This is a JavaScript file
// @ts-nocheck 
// 問題データ=================================

var quiz_data = [
	{'Q':'スマートフォンの開発で一般に使われていない言語は？', 
		'C':['Java','Objective-C','Swift','Basic'],
		'A':3, 'P':90 },
	{'Q':'現在、Webページで使われていない言語は？', 
		'C':['HTML','VCL','CSS','JavaScript'],
		'A':1,'P':80 },
	{'Q':'Webページに表示されないのはどのタグ？', 
		'C':['<p>','<hr>','<meta>','<div>'],
		'A':2, 'P':100 },
	{'Q':'JavaScriptで使われるオブジェクトは？', 
		'C':['エレメント','スペクトラム','エンティティ','コントローラー'],
		'A':0, 'P':120 },
	{'Q':'下の中で違う働きのものは？', 
		'C':['a = a + 1','a += 1','a++','--a'],
		'A':3, 'P':150 },
	{'Q':'ゲームを作るための専用のプログラムは？', 
		'C':['ゲームエンジン','ゲームドライブ','ゲームギア','ゲームコード'],
		'A':0, 'P':50 },
	{'Q':'以下の中でスマートフォンじゃないのは？', 
		'C':['Android','iPhone','ChromeBook','Windows Phone'],
		'A':2, 'P':30 },
	{'Q':'Monacaで使っているUIフレームワークは？', 
		'C':['カザンUI','オンセンUI','セントウUI','ヒトウUI'],
		'A':1, 'P':60 }
];

// これより処理==============================

var IndexedDB;
var idb;
var ver_number = 8; // バージョン番号
var data_max = 0; // データの数

var indexedDB = window.indexedDB || window.mozIndexedDB || window.msIndexedDB || window.webkitIndexedDB;


// 初期化処理
function initialDB(){
	var request = indexedDB.open("QuizDB", ver_number);
	
	// エラー時の処理
	request.onerror = function(event) {
		alert("ERROR!");
	};
	// 成功時の処理
	request.onsuccess = function(event) {
		idb = event.target.result;
		var transaction = idb.transaction(["quiz_data"],'readonly');
		var store = transaction.objectStore("quiz_data");
		var count_req = store.count();
		count_req.onsuccess = function(){
			data_max = count_req.result;
		}
	};
	// 更新時の処理
	request.onupgradeneeded = function(event) {
		idb = event.target.result;
		if (idb.objectStoreNames.contains('quiz_data')) {
			idb.deleteObjectStore('quiz_data');
		}
		var store = idb.createObjectStore("quiz_data", 
			{ keyPath: 'id', autoIncrement: true });
			
		var request2 = window.indexedDB.open("QuizDB", ver_number);
		
		request2.onsuccess = function(event2) {
			idb = event2.target.result;
			createData();
			var transaction = idb.transaction(["quiz_data"],'readonly');
			var store = transaction.objectStore("quiz_data");
			var count_req = store.count();
			 count_req.onsuccess = function(){
			 	data_max = count_req.result;
			 }
		};
	};
}

// データの新規作成
function createData(){
	var transaction = idb.transaction(["quiz_data"],'readwrite');
	var store = transaction.objectStore("quiz_data");
	for(var i = 0;i < quiz_data.length;i++){
		var data = quiz_data[i];
		store.put(data);
	}
}

initialDB(); //初期化を実行


