// ==UserScript==
// @name        我是一颗小虎牙
// @namespace   Violentmonkey Scripts
// @version     0.1
// @icon        https://www.huya.com/favicon.ico
// @match       *://www.huya.com/1*
// @match       *://www.huya.com/2*
// @match       *://www.huya.com/3*
// @match       *://www.huya.com/4*
// @match       *://www.huya.com/5*
// @match       *://www.huya.com/6*
// @match       *://www.huya.com/7*
// @match       *://www.huya.com/8*
// @match       *://www.huya.com/9*
// @match       *://www.huya.com/0*
// @match       *://www.huya.com/*
// @author      Dino
// @require     https://cdn.staticfile.org/jquery/3.3.1/jquery.min.js
// @require     http://ts9.fun/noticejs.js
// @description 自动发弹幕、自动领取每日宝箱、自动领取礼物宝箱、自动领取每日任务经验、自动切换最高清晰度，简洁的界面，快捷键操作等
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==

let videoScale;
let headerHeight;
let contentWidth;
let contentHeight;
let showChat;
let needSimplify;
let autoBest;
let autoDigTreasure;
let autoGetExp;
let fireData;
let fireTimer;
let stepTimer;
let isFiring;

let digTimer;
let expTimer;
let bestTimer;

let fireCount;
let tcTimer;

let guessData;
let sendRecords;

(function () {
	setTimeout(init, 600);
	// init();
})();

function init() {
	videoScale = 0.5625;
	headerHeight = 59;
	contentWidth = document.body.clientWidth - scrollbarWidth();//屏幕宽度减掉滚动条的宽度
	if (document.querySelector('.duya-header-wrap.clearfix'))
		headerHeight = document.querySelector('.duya-header-wrap.clearfix').clientHeight;
	contentHeight = document.body.clientHeight - headerHeight;
	speed = 2000;
	stopTime = 11000;
	showChat = localStorage.getItem("showChat") === 'true';

	needSimplify = localStorage.getItem("needSimplify");
	if (needSimplify == null) needSimplify = true;
	else needSimplify = needSimplify === 'true';

	autoBest = localStorage.getItem("autoBest");
	if (autoBest == null) autoBest = true;
	else autoBest = autoBest === 'true';

	autoDigTreasure = localStorage.getItem("autoDigTreasure");
	if (autoDigTreasure == null) autoDigTreasure = true;
	else autoDigTreasure = autoDigTreasure === 'true';

	autoGetExp = localStorage.getItem("autoGetExp");
	if (autoGetExp == null) autoGetExp = true;
	else autoGetExp = autoGetExp === 'true';

	isFiring = false;
	fireCount = 0;
	fireData = localStorage.getItem("fireData");
	if (fireData == null)
		fireData = {random: false, chp: false, mrbd: false, djt: false, speed: 2, duration: 60, bullets: []};
	else
		fireData = JSON.parse(fireData);
	log('fireData:' + JSON.stringify(fireData));

	guessData = localStorage.getItem("guessData");
	if (guessData == null)
		guessData = {date: getDate(), count: 0};
	else {
		guessData = JSON.parse(guessData);
		if (guessData.date !== getDate()) {
			guessData.date = getDate();
			guessData.count = 0;
			localStorage.setItem("guessData", JSON.stringify(guessData));
		}
	}
	log('guessData:' + JSON.stringify(guessData));

	initStyles();
	initHtml();
	if (needSimplify) {
		simplifiedUI();
		registHotKeys();
	}
	if (autoDigTreasure) digTreasure();
	if (autoGetExp) getExp();
	if (autoBest) getBestQuality();
	recordSend();
}

//界面简化
function simplifiedUI() {
	let title = document.querySelector('#J_roomTitle').innerText;
	let hTitle = '<h1 style="font-size: 2em;margin:0 20px 0 0"><a href="https://www.huya.com/" class="clickstat" style="color:#000;">' + title + '</a></h1>';
	let tDiv = document.querySelector('.duya-header-nav');
	tDiv.innerHTML = hTitle;
	tDiv.style.marginLeft = "0px";
	tDiv.style.display = "flex";
	tDiv.style.alignItems = "center";

	document.querySelector('#J_mainRoom').style.marginTop = headerHeight + 'px';
	document.querySelector('#J_mainRoom').style.padding = '0px';
	document.querySelector('#J_mainRoom').style.minWidth = '0px';
	document.querySelector('#J_mainWrap').style.padding = '0px';

	openHideChat();
	document.querySelector('.room-core').style.backgroundColor = '#333';
	document.querySelector('.player-gift-wrap').style.backgroundColor = '#333';
	document.querySelector('.hy-nav-title.new-clickstat').href = 'http://i.huya.com/index.php?m=Subscribe';
	// if(document.querySelector('.player-full-input'))
	//   document.querySelector('.player-full-input').style.display='block';
	if (document.querySelector('.match-room')) {
		document.querySelector('.match-room').style.marginLeft = '0';
		document.querySelector('.match-room').style.maxWidth = contentWidth + 'px';
	}

	let header = document.querySelector(".duya-header-bd.clearfix");
	let newNode = document.createElement("div");
	newNode.style.float = "left";
	newNode.style.height = "100%";
	newNode.style.display = "flex";
	newNode.style.alignItems = "center";
	newNode.innerHTML = '<div id="chatSwitcher" style="cursor: pointer;">' + document.querySelector(".host-name").innerText + '<br/>订阅:<em class="subscribe-count subscribe-count-ed" id="activityCount">0</em><br/>在线:<em class="host-spl" id="live-count">0</em></div>';
	header.insertBefore(newNode, document.querySelector("#J_duyaHdSearch"));
	// header.style.width='97%';
	header.style.margin = '0 auto';
	document.querySelector('#chatSwitcher').addEventListener('click', switchChat, false);

	if (document.querySelector('.host-prevStartTime') != null) {
		let temp = document.querySelector('.host-prevStartTime').innerText;
		new Interval(function () {
			log(document.querySelector('.recommend-live-forenotice'));
			if (document.querySelector('.recommend-live-forenotice') != null) {
				let p = document.querySelector('.recommend-live-forenotice').querySelector('p');
				p.innerHTML = p.innerText + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + temp;
				this.stop();
			}
		}, '', 1000);
	}

	removeChild('#J_spbg');
	removeChild('#duya-header-logo');
	removeChild('.mod-sidebar');
	removeChild('.hy-nav-right.hy-nav-kaibo');
	removeChild('.hy-nav-right.hy-nav-download');
	removeChild('#J_roomHeader');
	removeChild('.box-crumb');
	removeChild('#J_spbg');
	removeChild('.room-footer');

	let sub = document.createElement("div");
	let html = `
  <div class="room-hd-r">
    <div class="host-control J_roomHdCtrl">
      <div class="subscribe-entrance" style="margin:0px">
        <div class="subscribe-hd clickstat sub-on" id="yyliveRk_game_newsBut" eid="click/zhibo/unbook/2222971974" eid_desc="点击/直播间/取消订阅/2222971974">    
          <div class="subscribe-control"><em></em>已订阅</div>
          <div class="subscribe-count" id="activityCount">1185502</div>
        </div>
        <div class="entrance-expand subscribe-expand" style="display:none">
          <em class="entrance-expand-arr"></em>
          <div class="entrance-expand-bor"></div>
          <div class="subscribe-layer-wrap"></div>
        </div>
      </div>
    </div>
  </div>`

	sub.className = 'room-hd';
	sub.id = 'J_roomHeader';
	sub.style.width = '152px';
	sub.style.height = '30px';
	sub.style.marginTop = (headerHeight - 30) / 2 + 'px';
	sub.style.marginLeft = '10px';
	sub.style.float = 'left';
	sub.style.backgroundColor = 'transparent';
	sub.style.display = isLogin() ? 'block' : 'none';
	sub.innerHTML = html;
	document.querySelector('.duya-header-bd.clearfix').appendChild(sub);
}

//切换聊天框显示状态
function switchChat() {
	// showChat=!showChat;
	// localStorage.setItem("showChat", showChat);
	document.querySelector('#btnShowChat').click();
	openHideChat();
}

//隐藏或显示聊天框
function openHideChat() {
	let videoWidth = Math.floor(contentHeight / videoScale);
	let chatWidth = Math.floor(contentWidth - videoWidth);
	// let chatWidth=document.querySelector('.room-core-r').clientWidth;
	// log(chatWidth+'============'+document.querySelector('.room-core-r').clientWidth)
	// log(showChat)
	if (showChat) {
		document.querySelector('.room-core-r').style.display = 'block';
		document.querySelector('.room-core-r').style.height = contentHeight + 'px';
		document.querySelector('.room-core-r').style.width = chatWidth + 'px';
		document.querySelector('.room-core-l').style.width = videoWidth + 'px';
		document.querySelector('.room-core-l').style.marginLeft = '0px';
		// document.querySelector('.room-core-l').style.marginRight=chatWidth+'px';
		document.querySelector('#pub_msg_input').focus();
		document.querySelector('.player-full-input').style.display = 'none';
	} else {
		document.querySelector('.room-core-r').style.display = 'none';
		document.querySelector('.room-core-r').style.height = contentHeight + 'px';
		document.querySelector('.room-core-l').style.width = videoWidth + 'px';
		document.querySelector('.room-core-l').style.marginLeft = (chatWidth / 2) + 'px';
		document.querySelector('.player-full-input').style.display = 'block';
	}
}

//注册热键
function registHotKeys() {
	document.onkeydown = function (e) {
		log(e.keyCode);
		if (e.keyCode == 81 && e.ctrlKey)
			switchChat();//切换显示聊天区域
		else if (e.keyCode == 77 && e.ctrlKey)
			document.querySelector('#player-sound-btn').click();//切换是否静音
		else if (e.keyCode == 66 && e.ctrlKey)
			document.querySelector('#player-danmu-btn').click();//切换是否显示弹幕
		else if (e.keyCode == 38) {
			let textarea = document.querySelector(showChat ? '#pub_msg_input' : '#player-full-input-txt');
			if (textarea != null && sendRecords.length > 0 && document.activeElement.id === textarea.id) {
				let i = sendRecords.indexOf(textarea.value);
				if (i < sendRecords.length - 1) {
					if (i >= 0)
						textarea.value = sendRecords[i + 1];
					else
						textarea.value = sendRecords[0];
				}
			}
		} else if (e.keyCode == 40) {
			let textarea = document.querySelector(showChat ? '#pub_msg_input' : '#player-full-input-txt');
			if (textarea != null && sendRecords.length > 0 && textarea.value.length > 0 && document.activeElement.id === textarea.id) {
				let i = sendRecords.indexOf(textarea.value);
				if (i > 0)
					textarea.value = sendRecords[i - 1];
				else if (i === 0)
					textarea.value = '';
			}
		} else if (e.keyCode == 13) {
			if (document.activeElement.id === 'player-full-input-txt')
				document.querySelector('#player-full-input-btn').click();
			if (isLogin())
				document.querySelector(showChat ? '#pub_msg_input' : '#player-full-input-txt').focus();
		}
	}
}

function initHtml() {
	//自动发弹幕界面
	document.querySelector('.room-chat-tools').append(getIcon('J_roomChatIconBullet', '自动发弹幕', '&#xe622;'));

	let html = `
    <div>
      <input id="fireRandom" type="checkbox">
      <label for="fireRandom" class="side-label">随机弹幕</label>
    </div>
    ${getButtonHtml('btnChp', '彩虹屁', fireData.chp)}
    ${getButtonHtml('btnMrbd', '骂人宝典', fireData.mrbd)}
    ${getButtonHtml('btnDjt', '毒鸡汤', fireData.djt)}
    <textarea id="bullets" placeholder="输入要发送的弹幕,每行一条" rows="5" cols="40" style="resize: none;margin:5px"></textarea>
    <div style="width:100%;height:auto;text-align:center;">
      <button id="btnStart" class="cbtn${isFiring ? ' cked' : ''}" style="width:70%">${isFiring ? '停止发送弹幕' : '开始发送弹幕'}</button>
    </div>`;
	document.querySelector('.chat-room__ft').append(getPanel('J_roomChatBullet', '自动发弹幕', html));

	if (fireData.random)
		document.querySelector('#fireRandom').checked = true;
	if (fireData.bullets.length > 0)
		document.querySelector('#bullets').value = fireData.bullets.join("\n");
	document.querySelector('#fireRandom').addEventListener('click', onChecked);
	document.querySelector('#btnChp').addEventListener('click', onButtonClick);
	document.querySelector('#btnMrbd').addEventListener('click', onButtonClick);
	document.querySelector('#btnDjt').addEventListener('click', onButtonClick);
	document.querySelector('#btnStart').addEventListener('click', onButtonClick);
	document.querySelector('#bullets').addEventListener('input', function () {
		fireData.bullets = this.value.split('\n').filter(e => e !== '');
		localStorage.setItem("fireData", JSON.stringify(fireData));
	});
	onChecked();

	//设置界面
	document.querySelector('.room-chat-tools').append(getIcon('J_roomChatIconSetting', '设置', '&#xe60a;'));

	html = `
    ${getButtonHtml('btnSimplify', '简洁模式', needSimplify)}
    ${getButtonHtml('btnShowChat', (showChat ? '隐藏' : '显示') + '聊天面板', showChat)}
    ${getButtonHtml('btnTreasure', '自动挖宝箱', autoDigTreasure,!isLogin())}
    ${getButtonHtml('btnGetExp', '自动领取经验', autoGetExp,!isLogin())}
    ${getButtonHtml('btnAutoBest', '自动选择最高画质', autoBest)}
    <button id="btnAutoGuess" class="cbtn">刷竞猜任务</button>`
	document.querySelector('.chat-room__ft').append(getPanel('J_roomChatSetting', '设置', html));

	if (!needSimplify)
		$('#btnShowChat').attr("disabled", "disabled");
	else
		$('#btnShowChat').removeAttr("disabled");
	document.querySelector('#btnSimplify').addEventListener('click', onButtonClick);
	document.querySelector('#btnShowChat').addEventListener('click', onButtonClick);
	document.querySelector('#btnTreasure').addEventListener('click', onButtonClick);
	document.querySelector('#btnGetExp').addEventListener('click', onButtonClick);
	document.querySelector('#btnAutoBest').addEventListener('click', onButtonClick);
	document.querySelector('#btnAutoGuess').addEventListener('click', autoGuess);
}

function getIcon(id, title, icon) {
	let i = document.createElement("i");
	i.className = 'room-chat-tool iconfont';
	i.id = id;
	i.title = title;
	i.innerHTML = icon;
	i.addEventListener('click', function () {
		if (title !== '设置' && !isLogin()) {
			showMessage('你登录了吗?臭弟弟~', 'error');
			return;
		}
		let target = document.querySelector('#' + id.replace('Icon', ''));
		if (target !== null)
			target.style.display = target.style.display === 'block' ? 'none' : 'block';
	});
	return i;
}

function getPanel(id, title, content) {
	let html = `
  <div class="roomBlockWords">
    <div class="roomBlockWords-hd">${title}</div>
    <div class="roomBlockWords-bd" style="padding:5px;word-wrap:break-word;text-align:left;">
      ${content}
    </div>
    <i class="roomBlockWords-x" onclick="javascript:document.querySelector('#${id.replace('J_roomChat', 'J_roomChatIcon')}').click()"></i>
  </div>`
	let panel = document.createElement("div");
	panel.className = 'room-panel';
	panel.id = id;
	panel.style.display = 'none';
	panel.style.width = '99%';
	panel.style.zIndex = 1;
	panel.innerHTML = html;

	return panel;
}

function getButtonHtml(id, text, checked, disable = false) {
	let html = `<button id="${id}" class="cbtn${checked ? ' cked' : ''}" ${disable ? ' disabled="disabled"' : ''}>${text}</button>`;
	return html;
}

function onButtonClick() {
	let isChecked = this.className.indexOf('cked') > 0;
	switch (this.id) {
		case 'btnSimplify':
			if (window.confirm('切换显示模式需要刷新网页,是否继续?')) {
				needSimplify = !isChecked;
				localStorage.setItem("needSimplify", needSimplify);
				setTimeout(location.reload(), 1000);
			} else return;
			break;
		case 'btnShowChat':
			showChat = !isChecked;
			localStorage.setItem("showChat", showChat);
			openHideChat();
			if (!showChat)
				showMessage('聊天面板关闭后可以点击订阅人数或使用Ctrl+Q热键重新打开', 'info');
			break;
		case 'btnTreasure':
			autoDigTreasure = !isChecked;
			localStorage.setItem("autoDigTreasure", autoDigTreasure);
			if (autoDigTreasure) digTreasure();
			else clearInterval(digTimer);
			break;
		case 'btnGetExp':
			autoGetExp = !isChecked;
			localStorage.setItem("autoGetExp", autoGetExp);
			if (autoGetExp) getExp();
			else clearInterval(expTimer);
			break;
		case 'btnAutoBest':
			autoBest = !isChecked;
			localStorage.setItem("autoBest", autoBest);
			if (autoBest) getBestQuality();
			else clearInterval(bestTimer);
			break;
		case 'btnChp':
			fireData.chp = !isChecked;
			localStorage.setItem("fireData", JSON.stringify(fireData));
			break;
		case 'btnMrbd':
			fireData.mrbd = !isChecked;
			localStorage.setItem("fireData", JSON.stringify(fireData));
			break;
		case 'btnDjt':
			fireData.djt = !isChecked;
			localStorage.setItem("fireData", JSON.stringify(fireData));
			break;
		case 'btnStart':
			isFiring = !isChecked;
			this.innerText = isFiring ? '停止发送弹幕' : '开始发送弹幕';
			if (isFiring) {
				fire();
			} else {
				clearTimeout(stepTimer);
				clearTimeout(fireTimer);
			}
			break;
		default:
			break;
	}

	if (isChecked)
		this.classList.remove('cked')
	else
		this.classList.add('cked')
}

function onChecked() {
	fireData.random = document.querySelector('#fireRandom').checked;
	localStorage.setItem("fireData", JSON.stringify(fireData));
	if (fireData.random) {
		$('#btnChp').removeAttr("disabled");
		$('#btnMrbd').removeAttr("disabled");
		$('#btnDjt').removeAttr("disabled");
		$('#bullets').attr("disabled", "disabled");
	} else {
		$('#btnChp').attr("disabled", "disabled");
		$('#btnMrbd').attr("disabled", "disabled");
		$('#btnDjt').attr("disabled", "disabled");
		$('#bullets').removeAttr("disabled");
	}
}

//领取宝箱
function digTreasure() {
	if (isLogin()) return;
	digTimer = setInterval(() => {
		let didGet = false;
		document.querySelectorAll('.player-box-stat3')
			.forEach((item, index) => {
				if (item.style.visibility == "visible") {
					item.click();
					didGet = true;
					showMessage(`领取了第${index + 1}个宝箱`, 'success');
				}
			});
		if (didGet) document.querySelector("#player-box").style.display = "none";
		removeChild('.room-backToTop.j_room-backToTop');

		let tc = document.querySelector("#J_treasureChestContainer");
		if (tc != null) {
			if (tc.innerHTML.length > 0 && tc.innerText.indexOf('已领取') < 0) {
				if (tcTimer == null) startDig();
				else if (tcTimer.status == -1) startDig();
			}
		}
	}, 2000);
}

function startDig() {
	showMessage('检测到宝箱,开抢!!!', 'info');
	let tc = document.querySelector("#J_treasureChestContainer");
	tcTimer = new Interval(function () {
		if (tc.querySelector('.btn.usable') != null) {
			tc.querySelector('.btn.usable').click();
			showMessage('成功领取一个宝箱', 'success');
			sleep(500);
			if (document.querySelector('.tct-cont') != null)
				log(document.querySelector('.tct-cont').innerText)
			this.stop();
		} else {
			log(tc.querySelector('.btn').innerText + '===' + this.status);
		}
	}, 'dig', 500);
}

//领取任务经验
function getExp() {
	if (isLogin()) return;
	expTimer = setInterval(() => {
		document.querySelector("#J_hd_nav_user").dispatchEvent(new Event('mouseover'));
		setTimeout(function () {
			var btns = document.querySelectorAll('.status-get.J_get');
			if (btns.length > 0) {
				btns.forEach((item, index) => {
					if (item.textContent === '领取') {
						item.click();
						showMessage('领取了1个任务经验', 'success');
					}
				});
			}
		}, 1000);
	}, 60000);
}

//自动选择最高画质
function getBestQuality() {
	if (isLogin())
		bestTimer = setInterval(function () {
			if ($(".player-videotype-cur").html() != $(".player-videotype-list li:first").html())
				$(".player-videotype-list li:first").click();
			else
				clearInterval(bestTimer);
		}, 1000);
}

function fire() {
	loopFireBullet();
	fireTimer = setTimeout(() => {
		clearTimeout(stepTimer);
		isFiring = false;
		document.querySelector('#btnStart').innerText = '开始发送弹幕';
		document.querySelector('#btnStart').classList.remove('cked');
		log('clearTimeout')
	}, fireData.duration * 1000);
}

//发送弹幕
function fireBullet(bullet) {
	$(".chat-room__input>span").attr("class", "btn-sendMsg enable");
	$('#pub_msg_input').val(bullet.substr(0, 30));
	$('.btn-sendMsg').click();
	log(`第${fireCount}条:` + bullet);
}

//循环自动发送弹幕
async function loopFireBullet() {
	fireCount++;
	if (fireCount % 5 === 0) {
		log('休息一会吧');
		await sleep(5000);
	}
	if (fireData.random) {
		let types = [];
		if (fireData.chp) types.push('彩虹屁');
		if (fireData.mrbd) types.push('骂人宝典');
		if (fireData.djt) types.push('毒鸡汤');
		if (types.length <= 0) types = ['彩虹屁', '骂人宝典', '毒鸡汤'];

		let bullet = await getBulletByType(types[randomNum(0, types.length - 1)]);
		fireBullet(bullet);
		stepTimer = setTimeout(() => {
			loopFireBullet();
		}, randomNum(fireData.speed * 1000, (fireData.speed + 1) * 1000));
	} else {
		if (fireData.bullets.length > 0) {
			fireBullet(fireData.bullets[randomNum(0, fireData.bullets.length - 1)]);
			stepTimer = setTimeout(() => {
				loopFireBullet();
			}, randomNum(fireData.speed * 1000, (fireData.speed + 1) * 1000));
		} else {
			showMessage('请先输入要发送的弹幕', 'error');
			isFiring = false;
			document.querySelector('#btnStart').innerText = '开始发送弹幕';
			document.querySelector('#btnStart').classList.remove('cked');
		}
	}
}

//随机获取一条对应类别的弹幕
function getBulletByType(type) {
	let urls = {
		'彩虹屁': 'https://chp.shadiao.app/api.php',
		'骂人宝典': 'https://nmsl.shadiao.app/api.php?level=min',
		'毒鸡汤': 'https://du.shadiao.app/api.php'
	};
	return new Promise(resolve => {
		GM_xmlhttpRequest({
			method: "GET",
			url: urls[type],
			responseType: "text",
			onload: function (response) {
				let ret = response.response;
				if (ret != "")
					resolve(ret);
			}
		});
	});
}

//自动刷每日竞猜任务
async function autoGuess() {
	if (!isLogin()) {
		showMessage('你登录了吗?臭弟弟~', 'error');
		return;
	}
	let guessBoxs = document.querySelectorAll('.guess-main-box');
	if (guessBoxs != null && guessBoxs.length > 0 && document.querySelector('.guess-icon').style.display === 'block') {
		let successCount = 0;

		function doGuess() {
			document.querySelector('.guess-plan').querySelector('input').value = '1';
			document.querySelector('.guess-plan').querySelector('button').click();
			document.querySelector('.guess-plan').querySelector('input').value = '';
		}

		for (let i = 0; i < guessBoxs.length; i++) {
			let btns = guessBoxs[i].querySelectorAll('.guess-btn');
			if (btns[0].innerText.startsWith('种') && btns[1].innerText.startsWith('种')) {
				if (guessData.count >= 3 && !window.confirm(`今日已参与了${guessData.count}次竞猜,是否继续?`)) return;

				btns[0].click();
				if (document.querySelector('.my-bean').innerText.length <= 5)
					await sleep(500);
				doGuess();
				await sleep(500);

				btns[1].click();
				doGuess();
				await sleep(500);

				successCount++;
				guessData.count++;
				localStorage.setItem("guessData", JSON.stringify(guessData));
				showMessage(`成功参与一次竞猜,今日共参与了${guessData.count}次竞猜`, 'success');
			}
		}
		if (successCount === 0)
			showMessage('参与竞猜失败,好像还没人开盘哦', 'error');
	} else
		showMessage('该直播间好像没有开竞猜哦', 'error');
}

//记录发送的弹幕
function recordSend() {
	// document.querySelector('#player-ctrl-wrap').style.bottom='16px'
	sendRecords = [];

	function onSend() {
		let needRecord = false;
		let textarea = document.querySelector(showChat ? '#pub_msg_input' : '#player-full-input-txt');
		if (this.id === 'pub_msg_input')
			needRecord = event.keyCode === 13
		else if (this.id === 'msg_send_bt')
			needRecord = textarea.value != null && textarea.value.trim() != '';
		else if (this.id === 'player-full-input-txt')
			needRecord = event.keyCode === 13
		else if (this.id === 'player-full-input-btn')
			needRecord = textarea.value != null && textarea.value.trim() != '';


		if (needRecord) {
			let i = sendRecords.indexOf(textarea.value);
			if (i === 0) return;
			else if (i > 0)
				sendRecords.splice(i, 1, textarea.value)
			else
				sendRecords.splice(0, 0, textarea.value);
		}
	};

	// if(document.querySelector('#msg_send_bt')!=null)
	document.querySelector('#msg_send_bt').addEventListener('click', onSend);
	document.querySelector('#pub_msg_input').addEventListener('keydown', onSend);
	document.querySelector('#player-full-input-btn').addEventListener('click', onSend);
	document.querySelector('#player-full-input-txt').addEventListener('keydown', onSend);
}

function isLogin() {
	return document.querySelector('.no-login-tip').style.display !== 'block';
}

function showMessage(msg, type) {
	// type: success[green] error[red] warning[orange] info[blue]
	new NoticeJs({
		text: msg,
		type: type,
		position: 'topRight',
	}).show();
	log(msg);
}

//获取当前时间(可格式化)
function getDate(format = 'yyyy-MM-dd', addDay = 0) {
	let date = new Date();
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let strDate = date.getDate() + addDay;

	if (month >= 1 && month <= 9) {
		month = "0" + month;
	}
	if (strDate >= 0 && strDate <= 9) {
		strDate = "0" + strDate;
	}
	// let currentdate = year + " 年 " + month + " 月 " + strDate + " 日 ";
	let result = format.replace('yyyy', year).replace('MM', month).replace('dd', strDate);
	return result;
}

function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

//隐藏元素
function hideChild(v) {
	let child = document.querySelector(v);
	if (child)
		child.style.display = 'none';
}

//删除元素
function removeChild(v) {
	let child = document.querySelector(v);
	if (child)
		child.parentNode.removeChild(child);
}

//生成从minNum到maxNum的随机数
function randomNum(minNum, maxNum) {
	switch (arguments.length) {
		case 1:
			return parseInt(Math.random() * minNum + 1, 10);
			break;
		case 2:
			return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
			break;
		default:
			return 0;
			break;
	}
}

//带状态的TimeInterval
function Interval(fn, desc, ms) {
	this.desc = desc;
	this.status = -1;

	let that = this;

	this.id = window.setInterval(function () {
		that.status++;
		fn.call(that);
	}, ms);

	this.stop = function () {
		if (this.id) {
			window.clearInterval(this.id);
			this.id = 0;
			this.status = -1;
		}
	};
}

function log(msg) {
	console.log(`======huya_script_log======\n${msg}`);
}

function scrollbarWidth() {
	if (document.body.scrollHeight < window.innerHeight) return 0;
	var scrollDiv = document.createElement("div");
	scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;';
	document.body.appendChild(scrollDiv);
	var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
	document.body.removeChild(scrollDiv);
	return scrollbarWidth;
}

function initStyles() {
	let style = document.createElement("style");
	style.appendChild(document.createTextNode(`
  .noticejs-top{top:0;width:100%!important}.noticejs-top .item{border-radius:0!important;margin:0!important}.noticejs-topRight{top:10px;right:10px}.noticejs-topLeft{top:10px;left:10px}.noticejs-topCenter{top:10px;left:50%;transform:translate(-50%)}.noticejs-middleLeft,.noticejs-middleRight{right:10px;top:50%;transform:translateY(-50%)}.noticejs-middleLeft{left:10px}.noticejs-middleCenter{top:50%;left:50%;transform:translate(-50%,-50%)}.noticejs-bottom{bottom:0;width:100%!important}.noticejs-bottom .item{border-radius:0!important;margin:0!important}.noticejs-bottomRight{bottom:10px;right:10px}.noticejs-bottomLeft{bottom:10px;left:10px}.noticejs-bottomCenter{bottom:10px;left:50%;transform:translate(-50%)}.noticejs{font-family:Helvetica Neue,Helvetica,Arial,sans-serif}.noticejs .item{margin:0 0 10px;border-radius:3px;overflow:hidden}.noticejs .item .close{float:right;font-size:18px;font-weight:700;line-height:1;color:#fff;text-shadow:0 1px 0 #fff;opacity:1;margin-right:7px}.noticejs .item .close:hover{opacity:.5;color:#000}.noticejs .item a{color:#fff;border-bottom:1px dashed #fff}.noticejs .item a,.noticejs .item a:hover{text-decoration:none}.noticejs .success{background-color:#64ce83}.noticejs .success .noticejs-heading{background-color:#3da95c;color:#fff;padding:10px}.noticejs .success .noticejs-body{color:#fff;padding:10px}.noticejs .success .noticejs-body:hover{visibility:visible!important}.noticejs .success .noticejs-content{visibility:visible}.noticejs .info{background-color:#3ea2ff}.noticejs .info .noticejs-heading{background-color:#067cea;color:#fff;padding:10px}.noticejs .info .noticejs-body{color:#fff;padding:10px}.noticejs .info .noticejs-body:hover{visibility:visible!important}.noticejs .info .noticejs-content{visibility:visible}.noticejs .warning{background-color:#ff7f48}.noticejs .warning .noticejs-heading{background-color:#f44e06;color:#fff;padding:10px}.noticejs .warning .noticejs-body{color:#fff;padding:10px}.noticejs .warning .noticejs-body:hover{visibility:visible!important}.noticejs .warning .noticejs-content{visibility:visible}.noticejs .error{background-color:#e74c3c}.noticejs .error .noticejs-heading{background-color:#ba2c1d;color:#fff;padding:10px}.noticejs .error .noticejs-body{color:#fff;padding:10px}.noticejs .error .noticejs-body:hover{visibility:visible!important}.noticejs .error .noticejs-content{visibility:visible}.noticejs .progressbar{width:100%}.noticejs .progressbar .bar{width:1%;height:30px;background-color:#4caf50}.noticejs .success .noticejs-progressbar{width:100%;background-color:#64ce83;margin-top:-1px}.noticejs .success .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#3da95c}.noticejs .info .noticejs-progressbar{width:100%;background-color:#3ea2ff;margin-top:-1px}.noticejs .info .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#067cea}.noticejs .warning .noticejs-progressbar{width:100%;background-color:#ff7f48;margin-top:-1px}.noticejs .warning .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#f44e06}.noticejs .error .noticejs-progressbar{width:100%;background-color:#e74c3c;margin-top:-1px}.noticejs .error .noticejs-progressbar .noticejs-bar{width:100%;height:5px;background:#ba2c1d}@keyframes noticejs-fadeOut{0%{opacity:1}to{opacity:0}}.noticejs-fadeOut{animation-name:noticejs-fadeOut}@keyframes noticejs-modal-in{to{opacity:.3}}@keyframes noticejs-modal-out{to{opacity:0}}.noticejs-rtl .noticejs-heading{direction:rtl}.noticejs-rtl .close{float:left!important;margin-left:7px;margin-right:0!important}.noticejs-rtl .noticejs-content{direction:rtl}.noticejs{position:fixed;z-index:10050;width:320px}.noticejs ::-webkit-scrollbar{width:8px}.noticejs ::-webkit-scrollbar-button{width:8px;height:5px}.noticejs ::-webkit-scrollbar-track{border-radius:10px}.noticejs ::-webkit-scrollbar-thumb{background:hsla(0,0%,100%,.5);border-radius:10px}.noticejs ::-webkit-scrollbar-thumb:hover{background:#fff}.noticejs-modal{position:fixed;width:100%;height:100%;background-color:#000;z-index:10000;opacity:.3;left:0;top:0}.noticejs-modal-open{opacity:0;animation:noticejs-modal-in .3s ease-out}.noticejs-modal-close{animation:noticejs-modal-out .3s ease-out;animation-fill-mode:forwards}

  @font-face {
    font-family: 'iconfont';  /* project id 1963719 */
    src: url('//at.alicdn.com/t/font_1963719_pofdpfxgo5.eot');
    src: url('//at.alicdn.com/t/font_1963719_pofdpfxgo5.eot?#iefix') format('embedded-opentype'),
    url('//at.alicdn.com/t/font_1963719_pofdpfxgo5.woff2') format('woff2'),
    url('//at.alicdn.com/t/font_1963719_pofdpfxgo5.woff') format('woff'),
    url('//at.alicdn.com/t/font_1963719_pofdpfxgo5.ttf') format('truetype'),
    url('//at.alicdn.com/t/font_1963719_pofdpfxgo5.svg#iconfont') format('svg');
  }

  .iconfont{ 
    font-family:"iconfont";
    font-size:18px;
    font-style:normal;
    color: #409EFF;
    cursor: pointer;
    -webkit-font-smoothing: antialiased;
    -webkit-text-stroke-width: 0.2px;
    -moz-osx-font-smoothing: grayscale;
  }

  .cbtn {
    color: #409EFF;
    cursor: pointer;
    padding: 7px 15px;
    margin: 5px;
    border-radius: 5px;
    border-width: 1px;
    border-style: solid;
    border-color: #409EFF;
    outline: 0;
    background-color: transparent;
  }

  .cbtn:hover{
    color: #fff;
    border-color: #69a9ea;
    background-color: #69a9ea;
  }

  .cbtn:active{
    color: #fff;
    border-color: #409EFF;
    background-color: #409EFF;
  }

  .cbtn:disabled{
    color: #fff;
    outline: 0;
    background-color: #ccc;
    border-color: #ccc;
  }

  .cked{
    color: #fff;
    outline: 0px;
    background-color: #409EFF;
    border-color: #409EFF;
  }

  .cked:focus{
    color: #fff;
    outline: 0px;
    background-color: #409EFF;
    border-color: #409EFF;
  }

  input[type="checkbox"], input[type="radio"] {
    position: absolute;
    left: -9999px;
  }

  .side-label {
    position: relative;
    margin: 5px;
    padding-left: 20px;
    cursor: pointer;
    font-size: 14px;
  }

  .side-label::before, .side-label::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 0;
  }

  .side-label::before {
    display: block;
    width: 14px;
    height: 14px;
    border: 1px solid #409EFF;
  }

  input:focus + .side-label::before {
    border-color: #409EFF;
  }

  .side-label::after {
    display: none;
    width: 10px;
    height: 10px;
    margin: 3px;
    background-color: #409EFF;
  }

  input:checked + .side-label::after {
    display: block;
  }`));
	document.head.appendChild(style);
}

// (function webpackUniversalModuleDefinition(root,factory){if(typeof exports==='object'&&typeof module==='object')module.exports=factory();else if(typeof define==='function'&&define.amd)define("NoticeJs",[],factory);else if(typeof exports==='object')exports["NoticeJs"]=factory();else root["NoticeJs"]=factory()})(typeof self!=='undefined'?self:this,function(){return(function(modules){var installedModules={};function __webpack_require__(moduleId){if(installedModules[moduleId]){return installedModules[moduleId].exports}var module=installedModules[moduleId]={i:moduleId,l:false,exports:{}};modules[moduleId].call(module.exports,module,module.exports,__webpack_require__);module.l=true;return module.exports}__webpack_require__.m=modules;__webpack_require__.c=installedModules;__webpack_require__.d=function(exports,name,getter){if(!__webpack_require__.o(exports,name)){Object.defineProperty(exports,name,{configurable:false,enumerable:true,get:getter})}};__webpack_require__.n=function(module){var getter=module&&module.__esModule?function getDefault(){return module['default']}:function getModuleExports(){return module};__webpack_require__.d(getter,'a',getter);return getter};__webpack_require__.o=function(object,property){return Object.prototype.hasOwnProperty.call(object,property)};__webpack_require__.p="dist/";return __webpack_require__(__webpack_require__.s=2)})([(function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var noticeJsModalClassName=exports.noticeJsModalClassName='noticejs-modal';var closeAnimation=exports.closeAnimation='noticejs-fadeOut';var Defaults=exports.Defaults={title:'',text:'',type:'success',position:'topRight',timeout:30,progressBar:true,closeWith:['button'],animation:null,modal:false,scroll:{maxHeight:300,showOnHover:true},rtl:false,callbacks:{beforeShow:[],onShow:[],afterShow:[],onClose:[],afterClose:[],onClick:[],onHover:[],onTemplate:[]}}}),(function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.appendNoticeJs=exports.addListener=exports.CloseItem=exports.AddModal=undefined;exports.getCallback=getCallback;var _api=__webpack_require__(0);var API=_interopRequireWildcard(_api);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key]}}newObj.default=obj;return newObj}}var options=API.Defaults;function getCallback(ref,eventName){if(ref.callbacks.hasOwnProperty(eventName)){ref.callbacks[eventName].forEach(function(cb){if(typeof cb==='function'){cb.apply(ref)}})}}var AddModal=exports.AddModal=function AddModal(){if(document.getElementsByClassName(API.noticeJsModalClassName).length<=0){var element=document.createElement('div');element.classList.add(API.noticeJsModalClassName);element.classList.add('noticejs-modal-open');document.body.appendChild(element);setTimeout(function(){element.className=API.noticeJsModalClassName},200)}};var CloseItem=exports.CloseItem=function CloseItem(item){getCallback(options,'onClose');if(options.animation!==null&&options.animation.close!==null){item.className+=' '+options.animation.close}setTimeout(function(){item.remove()},200);if(options.modal===true&&document.querySelectorAll("[noticejs-modal='true']").length>=1){document.querySelector('.noticejs-modal').className+=' noticejs-modal-close';setTimeout(function(){document.querySelector('.noticejs-modal').remove()},500)}var position='.'+item.closest('.noticejs').className.replace('noticejs','').trim();setTimeout(function(){if(document.querySelectorAll(position+' .item').length<=0){let p=document.querySelector(position);if(p!=null){p.remove()}}},500)};var addListener=exports.addListener=function addListener(item){if(options.closeWith.includes('button')){item.querySelector('.close').addEventListener('click',function(){CloseItem(item)})}if(options.closeWith.includes('click')){item.style.cursor='pointer';item.addEventListener('click',function(e){if(e.target.className!=='close'){getCallback(options,'onClick');CloseItem(item)}})}else{item.addEventListener('click',function(e){if(e.target.className!=='close'){getCallback(options,'onClick')}})}item.addEventListener('mouseover',function(){getCallback(options,'onHover')})};var appendNoticeJs=exports.appendNoticeJs=function appendNoticeJs(noticeJsHeader,noticeJsBody,noticeJsProgressBar){var target_class='.noticejs-'+options.position;var noticeJsItem=document.createElement('div');noticeJsItem.classList.add('item');noticeJsItem.classList.add(options.type);if(options.rtl===true){noticeJsItem.classList.add('noticejs-rtl')}if(noticeJsHeader&&noticeJsHeader!==''){noticeJsItem.appendChild(noticeJsHeader)}noticeJsItem.appendChild(noticeJsBody);if(noticeJsProgressBar&&noticeJsProgressBar!==''){noticeJsItem.appendChild(noticeJsProgressBar)}if(['top','bottom'].includes(options.position)){document.querySelector(target_class).innerHTML=''}if(options.animation!==null&&options.animation.open!==null){noticeJsItem.className+=' '+options.animation.open}if(options.modal===true){noticeJsItem.setAttribute('noticejs-modal','true');AddModal()}addListener(noticeJsItem,options.closeWith);getCallback(options,'beforeShow');getCallback(options,'onShow');document.querySelector(target_class).appendChild(noticeJsItem);getCallback(options,'afterShow');return noticeJsItem}}),(function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();var _noticejs=__webpack_require__(3);var _noticejs2=_interopRequireDefault(_noticejs);var _api=__webpack_require__(0);var API=_interopRequireWildcard(_api);var _components=__webpack_require__(4);var _helpers=__webpack_require__(1);var helper=_interopRequireWildcard(_helpers);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key]}}newObj.default=obj;return newObj}}function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var NoticeJs=function(){function NoticeJs(){var options=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};_classCallCheck(this,NoticeJs);this.options=Object.assign(API.Defaults,options);this.component=new _components.Components();this.on('beforeShow',this.options.callbacks.beforeShow);this.on('onShow',this.options.callbacks.onShow);this.on('afterShow',this.options.callbacks.afterShow);this.on('onClose',this.options.callbacks.onClose);this.on('afterClose',this.options.callbacks.afterClose);this.on('onClick',this.options.callbacks.onClick);this.on('onHover',this.options.callbacks.onHover);return this}_createClass(NoticeJs,[{key:'show',value:function show(){var container=this.component.createContainer();if(document.querySelector('.noticejs-'+this.options.position)===null){document.body.appendChild(container)}var noticeJsHeader=void 0;var noticeJsBody=void 0;var noticeJsProgressBar=void 0;noticeJsHeader=this.component.createHeader(this.options.title,this.options.closeWith);noticeJsBody=this.component.createBody(this.options.text);if(this.options.progressBar===true){noticeJsProgressBar=this.component.createProgressBar()}var noticeJs=helper.appendNoticeJs(noticeJsHeader,noticeJsBody,noticeJsProgressBar);return noticeJs}},{key:'on',value:function on(eventName){var cb=arguments.length>1&&arguments[1]!==undefined?arguments[1]:function(){};if(typeof cb==='function'&&this.options.callbacks.hasOwnProperty(eventName)){this.options.callbacks[eventName].push(cb)}return this}}]);return NoticeJs}();exports.default=NoticeJs;module.exports=exports['default']}),(function(module,exports){}),(function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.Components=undefined;var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();var _api=__webpack_require__(0);var API=_interopRequireWildcard(_api);var _helpers=__webpack_require__(1);var helper=_interopRequireWildcard(_helpers);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key]}}newObj.default=obj;return newObj}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var options=API.Defaults;var Components=exports.Components=function(){function Components(){_classCallCheck(this,Components)}_createClass(Components,[{key:'createContainer',value:function createContainer(){var element_class='noticejs-'+options.position;var element=document.createElement('div');element.classList.add('noticejs');element.classList.add(element_class);return element}},{key:'createHeader',value:function createHeader(){var element=void 0;if(options.title&&options.title!==''){element=document.createElement('div');element.setAttribute('class','noticejs-heading');element.textContent=options.title}if(options.closeWith.includes('button')){var close=document.createElement('div');close.setAttribute('class','close');close.innerHTML='&times;';if(element){element.appendChild(close)}else{element=close}}return element}},{key:'createBody',value:function createBody(){var element=document.createElement('div');element.setAttribute('class','noticejs-body');var content=document.createElement('div');content.setAttribute('class','noticejs-content');content.innerHTML=options.text;element.appendChild(content);if(options.scroll!==null&&options.scroll.maxHeight!==''){element.style.overflowY='auto';element.style.maxHeight=options.scroll.maxHeight+'px';if(options.scroll.showOnHover===true){element.style.visibility='hidden'}}return element}},{key:'createProgressBar',value:function createProgressBar(){var element=document.createElement('div');element.setAttribute('class','noticejs-progressbar');var bar=document.createElement('div');bar.setAttribute('class','noticejs-bar');element.appendChild(bar);if(options.progressBar===true&&typeof options.timeout!=='boolean'&&options.timeout!==false){var frame=function frame(){if(width<=0){clearInterval(id);var item=element.closest('div.item');if(options.animation!==null&&options.animation.close!==null){item.className=item.className.replace(new RegExp('(?:^|\\s)'+options.animation.open+'(?:\\s|$)'),' ');item.className+=' '+options.animation.close;var close_time=parseInt(options.timeout)+500;setTimeout(function(){helper.CloseItem(item)},close_time)}else{helper.CloseItem(item)}}else{width--;bar.style.width=width+'%'}};var width=100;var id=setInterval(frame,options.timeout)}return element}}]);return Components}()})])});
