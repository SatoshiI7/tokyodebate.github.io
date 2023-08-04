//既に存在している大量のサイトにそれぞれjQueryのCDNとcssを手作業で追加していくのは現実的ではないのでこのファイル内で読み込む
//load jQuery
var script = document.createElement("SCRIPT");
script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
script.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(script);

//load css (もっと良い方法があると思われる、pullするまでこのリンクは無効である)
var link_style = document.createElement("link");
link_style.setAttribute("rel", "stylesheet");
link_style.setAttribute(
	"href",
	"https://tokyodebate.github.io/css/motion-stats.css"
); //
document.body.appendChild(link_style);

function loadMotions(url) {
	if (window.jQuery) {
		var results = Papa.parse(url, {
			download: true,
			delimiter: "\t",
			quoteChar: "",
			escapeChar: "",
			header: false,
			skipEmptyLines: "greedy",
			complete: function (results) {
				showMotions(results.data);
			},
		});
	} else {
		//if jQuery is not loaded, retry 20ms later
		window.setTimeout(function () {
			loadMotions(url);
		}, 20);
	}
}

function len(data) {
	return data ? data.length : 0;
}

function showMotions(array) {
	myRoundLabel = $("<p></p>");
	myMotionsList = [];
	myTournamentName = "";
	myArticle = $("<article></article>").appendTo("section");
	myArticle.append(`<p class="h2">Motions for ${array[0][0]}</p>`);
	for (var line = 0; line < array.length; line++) {
		switch (len(array[line])) {
			case 2: //Tournament
				myTournamentName = array[line][1];
				myTournament = $("<div class='card-body'></div>")
					.appendTo($("<div class='card mb-3'></div>").appendTo(myArticle))
					.append(`<h3 class="card-title px-3">${myTournamentName}</h3>`);
				break;
			case 3: //Round
				if (myRoundLabel) {
					//前のラウンドのCopy Buttonを生成する
					createCopyButton(myMotionsList, myRoundLabel);
				}
				myRound = $("<div class='card-body'></div>").appendTo(myTournament);
				//Copyボタンように[[motion, info], [motion, info], ...]を保存するリスト
				myMotionsList = [];
				//後にCopyボタンを追加する対象。css flexboxを利用
				myRoundLabel = $(
					`<div class='card-header border-bottom border-danger d-flex justify-content-between align-items-center'>${array[line][2]}</div>`
				).appendTo(myRound);

				break;
			case 4: //Motion
				myMotion = $(
					"<div style='display: flex; flex-direction: column'></div>"
				)
					.appendTo(myRound)
					.append(`<h3 class="card-title px-3 pt-4">${array[line][3]}</h3>`);
				myMotionsList.push([array[line][3], ""]);
				break;
			case 5: //Info
				if (!array[line][4].includes("$stats")) {
					myMotion.append(
						$(`<p class="card-text mx-3 px-3">${array[line][4]}</p>`)
					);
					myMotionsList[myMotionsList.length - 1][1] += array[line][4] + "\n";
				} else {
					//Motion statsの場合、.txtファイルにxx $stats a, b, ...の形式で書かれている
					showStats(array[line][4], myMotion);
				}
			default:
		}
	}
	//次のroundに差し掛かった際にcopy buttonを生成する都合上、最後のラウンドのみ手動で生成する
	createCopyButton(myMotionsList, myRoundLabel);
}

//motion statisticsのバーを表示する
function showStats(text, motion) {
	textSplit = text.split(/ ?\$stats ?/);
	stats = textSplit[1].split(/[ |,]+/);
	myBar = $(`<div class="card-subtitle stats-row px-3 pt-4"></div>`)
		.append(`<div class="stats-label">${textSplit[0]}</div>`)
		.appendTo(motion);
	switch (stats.length) {
		case 2: //○○ $stats (govの勝ち数), (oppの勝ち数)はNA
			myBar.append(
				$(
					`<div class="stats-container" style="grid-template-columns: ${stats[0]}fr ${stats[1]}fr;">
						<div class="stats-bar stats-blue">${stats[0]}</div>
						<div class="stats-bar stats-red">${stats[1]}</div>
					</div>`
				)
			);
			break;
		case 3: //○○ $stats (gov), (opp), (全体)はAsian
			myBar.append(
				$(
					`<div class="stats-container" style="grid-template-columns: ${
						stats[0]
					}fr ${stats[1]}fr ${stats[2] - stats[0] - stats[1]}fr;">
						<div class="stats-bar stats-blue">${stats[0]}</div>
						<div class="stats-bar stats-red">${stats[1]}</div>
						<div class="stats-bar stats-gray">${stats[2] - stats[0] - stats[1]}</div>
					</div>`
				)
			);
			break;
		case 4: //○○ $stats (1位), (2位), (3位), (4位)はBP
			myBar.append(
				$(
					`<div class="stats-container" style="grid-template-columns: ${stats[0]}fr ${stats[1]}fr ${stats[2]}fr ${stats[3]}fr;">
						<div class="stats-bar stats-blue">${stats[0]}</div>
						<div class="stats-bar stats-blue-light">${stats[1]}</div>
						<div class="stats-bar stats-red-light">${stats[2]}</div>
						<div class="stats-bar stats-red">${stats[3]}</div>
					</div>`
				)
			);
			break;
		default:
	}
}

//Copy buttonを作る
function createCopyButton(myMotionsList, myRoundLabel) {
	//[motion, info]の組のリストでであるmyMotionsListをコピーするテキストに変換
	var myMotionText = "";
	var myInfoText = "";
	if (myMotionsList.length === 1) {
		//NA or BP
		myMotionText = `\n\n**Motion**: ${myMotionsList[0][0]}`;
		if (myMotionsList[0][1] != "") {
			myInfoText = `**\n\nInfo**: ${myMotionsList[0][1]}`;
		}
	} else if (myMotionsList.length <= 3 && myMotionsList.length >= 1) {
		//AsianはMotion/info Aなどと表記
		console.log(myMotionsList);
		for (var i = 0; i < 3; i++) {
			myMotionText += `\n\n**Motion ${["A", "B", "C"][i]}**: ${
				myMotionsList[i][0]
			}`;
			if (myMotionsList[i][1] != "") {
				myInfoText += `\n\n**Info ${["A", "B", "C"][i]}**: ${
					myMotionsList[i][1]
				}`;
			}
		}
	}
	myMotionText += `\n\n(${
		myRoundLabel.text().split(":")[0]
	}, ${myTournamentName}`;
	//Create div for buttons
	myButtons = $("<div class='d-inline'></div>").appendTo(myRoundLabel);
	//Info
	if (myInfoText != "") {
		$("<button class='btn btn-outline-secondary'>Copy Info</button>")
			.appendTo(myButtons)
			.on("click", function () {
				navigator.clipboard.writeText(myInfoText.slice(2));
			});
	}
	$("<button class='btn btn-outline-secondary'>Copy Motion</button>")
		.appendTo(myButtons)
		.on("click", function () {
			navigator.clipboard.writeText(myMotionText.slice(2));
		});
}
