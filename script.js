/* pulp game: a game of pulps */
/* @author: Abdelbary Mohamed, 2022 */

//DONE SCOREBOARD
//DONE TIMER
//DONE PAUSE TIMER
//DONE SUCCESS Message
//DONE GREEN NUMBERS
//DONE CREATE LEVELS AND SAVE THEM
//DONE Restart Timer
//DONE save and load progress
//DONE socreboard presistant
//DONE edit level

let GAME_PLANS = [
[
`
###1###
#0###2#
#######
@##@##@
#######
#@###2#
###3###
`, "easy"
],
[
`
##0#@##
#######
@#@#3#@
###1###
2#@#@#@
#######
##@#2##
`, "medium"
],
[`
#@########
#####3#2#@
#0@####@##
####@#####
#1##@1@###
###@@@##3#
#####@####
##1####0@#
3#@#0#####
########0#
`, "hard"
]
]

let scores = [];
let loads = [];

const easyBtn = document.querySelector('#easy-btn');
const mediumBtn = document.querySelector('#medium-btn');
const hardBtn = document.querySelector('#hard-btn');
const restartBtn = document.querySelector('#restart');
const table = document.querySelector('table');
const textArea = document.querySelector('textarea');
const addUserBtn = document.querySelector("#add-user");
const scoreBoard = document.querySelector("#scoreboard");
const inputName = document.querySelector("#user-name");
const pauseBtn = document.querySelector("#pause-btn");
const currentUser = document.querySelector("#current-user");
const addLevelBtn = document.querySelector("#add-level-btn")
const loadLevelBtn = document.querySelector("#load-level-btn");
const editLevelBtn = document.querySelector("#edit-level-btn");
const saveBtn = document.querySelector("#save-btn");
const loadBtn = document.querySelector("#load-btn");

let userName;
let selectedLevel;
let currentLevel;

//TIMER
let lag = 0;
let timer;
let timing = "00:00:00";
let pausedTime;
let paused = false;

// website desgin

const changeDate = (cntDown, lag) => {
  let x = setInterval(function() {
    let now = new Date().getTime();
    let diff = (lag) ? (now - cntDown) + lag : now - cntDown;
    pausedTime = diff;
    let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((diff % (1000 * 60)) / 1000);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    timing = hours + ":" + minutes + ":" + seconds;
    document.querySelector("#timer").innerText = timing;
    }, 1000);

  return x;
}

const handlePauseBtn = (e) => {
  if (paused) {
    lag = pausedTime;
    pauseBtn.innerText = "Pause";
    timer = changeDate(new Date().getTime(), lag);
    paused = false;
  } else {
    clearInterval(timer);
    pauseBtn.innerText = "Continue";
    paused = true;
  }
}

const handeAddUser = (e) => {
  currentUser.innerText = `${inputName.value} is playing`;
  userName = inputName.value;
  inputName.value = "";
  timer = changeDate(new Date().getTime());
}

addUserBtn.addEventListener("click", handeAddUser);
pauseBtn.addEventListener("click", handlePauseBtn);

// game design
class Tile {
  constructor(ch) {
    this.number = -1;
    this.color = "black";
    if (ch == "#") this.color = "white";
    if (!isNaN(ch)) this.number = parseInt(ch);
  }
}

class Level {
  constructor(plan) {
    let rows = plan.trim().split("\n").map(l => [...l]);
    this.size = rows.length;
    this.rows = rows.map((row, y) => row.map((ch, x) => new Tile(ch)));
  }
}

const getColor = (td) => td.getAttribute("style").split(' ')[1];
const getAdjacent = (i, level) => [i+1, i-1, i+level.size, i-level.size].filter(x => level.getTDs()[x]).map(x => level.getTDs()[x]);
const getNumberOfColor = (y, level) => level.getTDs().filter(x => getColor(x) == y).length;
const getNumberedTDs = level => level.getTDs().filter(x => !isNaN(parseInt(x.innerText)));

const succesMessage = () => {
  setTimeout(() => alert("The puzzle has been solved!"), 30);
  if (!userName) return;
  let li = document.createElement("li");
  let score = `${userName} solved ${selectedLevel[1]} in ${timing}`
  scores = [...scores, score];
  console.log(scores);
  localStorage.setItem("scores", JSON.stringify(scores));
  li.innerText = score;
  scoreBoard.appendChild(li);
  clearInterval(timer);
  document.querySelector("#timer").innerText = "00:00:00";
}

Level.prototype.getTDs = function(){
  return Array.from(document.querySelectorAll('td'));
};


Level.prototype.isLightOkay = (level) =>  (getNumberOfColor("black", level) + getNumberOfColor("yellow", level)) == (level.size ** 2);
Level.prototype.isAdjacentOkay = (level) => {
  let numberedTDs = getNumberedTDs(level);
  let numberofBulbAdjacents = numberedTDs.map(x => getAdjacent(parseInt(x.dataset.index), level)).map(x => x.filter(y => y.dataset.isBulb).length);

  for(let i = 0; i < numberedTDs.length; i++)
    if (parseInt(numberedTDs[i].innerText) != numberofBulbAdjacents[i]) return false;

  return true;
}

Level.prototype.colorTheNumber = (level) => {
  let numberedTDs = getNumberedTDs(level);
  let numberofBulbAdjacents = numberedTDs.map(x => getAdjacent(parseInt(x.dataset.index), level)).map(x => x.filter(y => y.dataset.isBulb).length);
  for(let i = 0; i < numberedTDs.length; i++){
    if (parseInt(numberedTDs[i].innerText) == parseInt(numberofBulbAdjacents[i])) /*&& parseInt(numberedTDs[i].innerText) != 0)*/ numberedTDs[i].classList.add("greenBlack");
    else numberedTDs[i].classList.remove("greenBlack")
    //if (parseInt(numberedTDs[i].innerText) == panumberofBulbAdjacents[i])
  }
}

Level.prototype.isSolved = (level) => level.isLightOkay(level) && level.isAdjacentOkay(level)
Level.prototype.isNotCollision = (e, level) => {
  let index = parseInt(e.dataset.index);
  let x = parseInt(e.dataset.x);
  let y = parseInt(e.dataset.y);
  let size = level.size ** 2;
  let tds = level.getTDs();

  const isBulbRow = (i, inc) => {
    while (i < size && i >= 0 && getColor(tds[i]) != "black") {
      if (tds[i].dataset.y == y && tds[i].dataset.isBulb) {
        return false;
      }
      inc ? i++ : i--;
    }
    return true;
  }
  const isBulbCol = (i, inc) => {
    while (i < size && i >= 0 && getColor(tds[i]) != "black") {
      if (tds[i].dataset.x == x && tds[i].dataset.isBulb) return false;
      inc ? i+=parseInt(level.size) : i-=parseInt(level.size);
    }
    return true;
  }
  return (isBulbCol(index, true) && isBulbCol(index, false) && isBulbRow(index, true) && isBulbRow(index, false));
}

const colorRowCol = (e, level, color) => {
  let index = parseInt(e.dataset.index);
  let x = parseInt(e.dataset.x);
  let y = parseInt(e.dataset.y);
  let size = level.size ** 2;
  let tds = level.getTDs();
  const colorTDh = (i, inc) => {
    while (i < size && i >= 0 && getColor(tds[i]) != "black") {
      if (tds[i].dataset.y == y) {
        setInterval(tds[i].setAttribute("style", `background-color: ${color}`), 3000000);
      }
      inc ? i++ : i--;
    }
  }
  const colorTDv = (i, inc) => {
    while (i < size && i >= 0 && getColor(tds[i]) != "black") {
      if (tds[i].dataset.x == x) {
        setInterval(tds[i].setAttribute("style", `background-color: ${color}`), 3000000);
      }
      inc ? i+=parseInt(level.size) : i-=parseInt(level.size);
    }
  }
  colorTDh(index, true);
  colorTDh(index, false);
  colorTDv(index, true);
  colorTDv(index, false);
}

Level.prototype.reColor = (level) => level.getTDs().filter(x => (x.dataset.isBulb)).forEach(x => colorRowCol(x, level, "yellow"));

Level.prototype.handelClick = (e, level) => {
  let index = parseInt(e.dataset.index);
  let tds = level.getTDs();
  colorRowCol(e, level, "yellow");
  let appendBulb = (td) => {
    let img = document.createElement("img");
    img.setAttribute("src", "./media/bulb.png");
    img.setAttribute("style", "width: 1em");
    td.appendChild(img);
    td.dataset.isBulb = true;
  }
  if (getColor(tds[index]) != "black") appendBulb(tds[index]);
  if (level.isSolved(level)) succesMessage();
  level.colorTheNumber(level);

}

Level.prototype.undoClick = (e, level) => {
  let index = parseInt(e.dataset.index);
  let tds = level.getTDs();
  let reColor = level.reColor;
  colorRowCol(e, level, "white");
  let removeBulb = (td) => {
    td.removeChild(td.childNodes[0]);
    delete td.dataset.isBulb;
  }
  removeBulb(tds[index]);
  reColor(level);
  level.colorTheNumber(level, "green");
}

Level.prototype.handleTotalClick = (e, level) => {
  if (e.target.nodeName == "IMG") e = e.target.parentElement;
  else e = e.target;

  let tds = level.getTDs();
  let handleClick = level.handelClick;
  let undoClick = level.undoClick;
  let isNotCollision = level.isNotCollision;

  if (e.dataset.isBulb) {
    undoClick(e, level);
  } else if (isNotCollision(e, level)) {
    handleClick(e, level);
  }
}

Level.prototype.drawLevel = function() {
  table.innerHTML = '';
  for (let i = 0; i < this.size; i++) {
    let tr = document.createElement('tr');
    for (let j = 0; j < this.size; j++) {
      let cell = this.rows[i][j];
      let td = document.createElement('td');
      td.dataset.x = j;
      td.dataset.y = i;
      td.dataset.index = this.size * i + j;
      td.setAttribute("style", `background-color: ${cell.color}`);
      if (cell.number != -1) td.innerText = `${cell.number}`
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  let tds = this.getTDs();
  tds.forEach(x => x.addEventListener('click', x => this.handleTotalClick(x, this)));
  this.colorTheNumber(this);
};


function startGame(x){
  table.innerHTML = "";
  selectedLevel = x;
  textArea.placeholder = x[0];
  currentLevel = new Level(x[0]);
  currentLevel.drawLevel();
}

function restartGame(){
  table.innerHTML = "";
  new Level(selectedLevel[0]).drawLevel();
  lag = 0;
  pausedTime = 0;
  timing = "00:00:00";
  clearInterval(timer);
  timer = changeDate(new Date().getTime());
}



const addLevel = (e) => {
  let name = prompt("level's name: ");
  GAME_PLANS = [...GAME_PLANS, [textArea.value, name]];
  let planString = JSON.stringify(GAME_PLANS);
  localStorage.setItem("plans", planString);
  textArea.value = "";
}

const loadLevel = (e) => {
  let name = prompt("level's name: ");
  GAME_PLANS = JSON.parse(localStorage.getItem("plans"));
  let level = GAME_PLANS.filter(x => x[1] == name)[0];
  startGame(level);
}

//TODO edit levels
const editLevel = (e) => {
  let name = prompt("level's name: ");
  GAME_PLANS = JSON.parse(localStorage.getItem("plans"));
  let level = GAME_PLANS.filter(x => x[1] == name)[0];
  textArea.value = level[0];

  let x = textArea.addEventListener("change", () => {
    level[0] = textArea.value;
    GAME_PLANS = [level, ...GAME_PLANS];
    localStorage.setItem("plans", JSON.stringify(GAME_PLANS));
    setTimeout(textArea.removeEventListener("change", x), 50000);
  });

};

const loadScoreBoard = () =>  {
  scores = JSON.parse(localStorage.getItem("scores"));
  scores.forEach(x => {
    let li = document.createElement("li");
    li.innerText = x;
    scoreBoard.appendChild(li);
  });
};

const save = (e, level) => {
  let name = prompt("progress name");
  let tds = level.getTDs().filter(x => (x.dataset.isBulb)).map(x => x = x.dataset.index);
  console.log(tds);
  let arr = [name, tds, selectedLevel];
  loads = [...loads, arr];
  localStorage.setItem("loads", JSON.stringify(loads));
};

const load = (e) => {
  let name = prompt("progress name");
  let loads = JSON.parse(localStorage.getItem("loads"));
  let load = loads.filter(x => x[0] == name)[0];
  let newLevel = new Level(load[2][0]);
  let handleClick = newLevel.handelClick;
  newLevel.drawLevel();
  let tds = newLevel.getTDs();
  let bulbs = load[1];
  console.log(load);
  tds.forEach(x => {
    if (bulbs.some(y => y == x.dataset.index)) handleClick(x, newLevel);
  });
  currentLevel = newLevel;
  newLevel.reColor(newLevel);
  newLevel.colorTheNumber(newLevel);
};

addLevelBtn.addEventListener("click",  addLevel);
loadLevelBtn.addEventListener("click",  loadLevel);
easyBtn.addEventListener("click", () => startGame(GAME_PLANS[0]));
mediumBtn.addEventListener("click", () => startGame(GAME_PLANS[1]));
hardBtn.addEventListener("click", () => startGame(GAME_PLANS[2]));
restartBtn.addEventListener("click", restartGame);
saveBtn.addEventListener("click", (e) => save(e, currentLevel));
loadBtn.addEventListener("click", load);
editLevelBtn.addEventListener("click", editLevel);

// GAME_PLANS = JSON.parse(localStorage.getItem("plans"));

startGame(GAME_PLANS[0]);
loadScoreBoard();
