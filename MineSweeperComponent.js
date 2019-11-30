const { ipcRenderer } = require('electron');
require('./segment_display/segment.js');

function forEachAdjecent(xPos, yPos, xMax, yMax, fn){
  if(yPos > 0){
    fn(xPos, yPos - 1);
  }
  if(yPos < yMax - 1){
    fn(xPos, yPos + 1);
  }

  if(xPos > 0){
    fn(xPos - 1, yPos);
    if(yPos > 0){
      fn(xPos - 1, yPos - 1);
    } 
    if(yPos < yMax - 1){
      fn(xPos - 1, yPos + 1);
    }
  }
  if(xPos < xMax - 1){
    fn(xPos + 1, yPos);
    if(yPos > 0){
      fn(xPos + 1, yPos - 1);
    } 
    if(yPos < yMax - 1){
      fn(xPos + 1, yPos + 1);
    }
  }
}

class MineSweeper extends HTMLElement {
  constructor(){
    super();
    this.marginNoOverflow = '--margin-left: calc( -1 * calc(var(--y-length) * 2rem + (var(--y-length) + 1) * 1px) /2);';
    this.marginOverflow = '--margin-left: 0px; left: 0px;';
  }

  calculateSurroundingBombs(xPos, yPos){
    let surroundingBombs = 0;
    forEachAdjecent(xPos, yPos, this.xLength, this.yLength, (x, y) => (surroundingBombs += this.field[x][y].bomb ? 1 : 0));
    return surroundingBombs;
  }

  placeMines(xPosClicked, yPosClicked){
    [...Array(this.mineCount)].forEach(() => {
      let minePlaced = false;
      while(!minePlaced){
        let xMinePos = Math.floor(Math.random() * this.xLength);
        let yMinePos = Math.floor(Math.random() * this.yLength);

        if(!(xPosClicked == xMinePos && yPosClicked == yMinePos) && this.field[xMinePos][yMinePos].bomb != 'x') {
          this.field[xMinePos][yMinePos].bomb = 'x'
          minePlaced = true;
        }
      }
    })
  }

  checkAdjecentForZero(xPos, yPos){
    let adjecentSpaces = []
    forEachAdjecent(xPos, yPos, this.xLength, this.yLength, (x, y) => {
      if(!this.field[x][y].classList.contains('pressed')){
        this.field[x][y].classList.add('pressed');
        let surroundingBombs = this.calculateSurroundingBombs(x, y);
        this.field[x][y].innerHTML = `<span>${surroundingBombs}</span>`;
        if(surroundingBombs == 0){
          adjecentSpaces.push(() => this.checkAdjecentForZero(x, y));
        }
      }      
    });
    for(let i = 0; i < adjecentSpaces.length; i++){
      adjecentSpaces[i]();
    }    
  }

  checkVictory(){
    let victory = true;

    this.field.forEach((columns, xPos) => columns.forEach((field, yPos) => {
      if(!field.bomb && field.flag) victory = false;
      if(field.bomb && !field.flag) victory = false;
    }));

    return victory;
  }

  gameOver(won){
    let overlayMessage = this.overlayMessage = document.createElement('div');
    overlayMessage.className = `overlay ${won ? 'won' : 'lost'}`;
    overlayMessage.innerHTML = won ? 'won' : 'lost';
    overlayMessage.addEventListener('dblclick', (event) => { this.resetGame(); });
    this.append(overlayMessage);
  }

  hitBomb(){
    this.field.forEach((col, xPos) => col.forEach((field, yPos) => {
      let suroundingBombs = this.calculateSurroundingBombs(xPos, yPos);
      field.pressed = true;
      field.classList.add('pressed');
      field.innerHTML = field.bomb ? `<span style="color: red;">${field.bomb}</span>` : `<span>${suroundingBombs}</span>`;
    }));
    this.gameOver(false);
  }

  createControlUI(){
    let controlls = document.createElement('div');
    let resetBtn = document.createElement('button');
    let xInput = this.xInput = document.createElement('input');
    let yInput = this.yInput = document.createElement('input');
    let minesInput = this.minesInput = document.createElement('input');

    let xInputLabel = document.createElement('div');
    let yInputLabel = document.createElement('div');
    let minesInputLabel = document.createElement('div');

    controlls.className = 'control';
    resetBtn.className = 'reset-btn ctrl';
    resetBtn.innerHTML = 'Reset';
    xInput.className = 'x-in ctrl';
    xInput.type = 'number';
    xInput.value = 10;
    yInput.className = 'y-in ctrl';
    yInput.type = 'number';
    yInput.value = 10;
    minesInput.className = 'mines-in ctrl';
    minesInput.type = 'number';
    minesInput.value = 15;

    xInputLabel.className = 'x-in-label ctrl-label';
    yInputLabel.className = 'y-in-label ctrl-label';
    minesInputLabel.className = 'mines-in-label ctrl-label';

    xInputLabel.innerHTML = '<span>Width:</span>';
    yInputLabel.innerHTML = '<span>Height:</span>';
    minesInputLabel.innerHTML = '<span>Mines:</span>';
    
    resetBtn.addEventListener('click', (event) => { this.resetGame(); });

    controlls.append(xInput, yInput, minesInput, resetBtn);
    controlls.append(xInputLabel, yInputLabel, minesInputLabel);
    
    this.append(controlls);
    controlls.append(...this.createSevenSegmentDisplays());
    this.updateSegmentDisplay();
  }

  createSevenSegmentDisplays(){
    let result = [];
    let minesLeftSegment = document.createElement('div');
    let timePassedSegment = document.createElement('div');
    
    minesLeftSegment.className = 'segment-display-container mines-left';
    timePassedSegment.className = 'segment-display-container time-passed';

    this.segmentDisplays = [
      document.createElement('seven-segment-digit'), 
      document.createElement('seven-segment-digit'), 
      document.createElement('seven-segment-digit')
    ];

    this.timeSegmentDisplays = [
      document.createElement('seven-segment-digit'),
      document.createElement('seven-segment-digit'),
      document.createElement('seven-segment-digit')
    ];

    this.segmentDisplays.forEach((segmentDisplay, index) => {
      segmentDisplay.className = `segment-digit segment-${index}`;
      minesLeftSegment.append(segmentDisplay);
    });

    this.timeSegmentDisplays.forEach((segmentDisplay, index) => {
      segmentDisplay.className =  `segment-digit segment-time-${index}`;
      timePassedSegment.append(segmentDisplay);
    });

    setInterval(this.updateTimeSegmentDisplay.bind(this), 1000);

    result.push(minesLeftSegment);
    result.push(timePassedSegment);

    return result;
  }

  resetGame(){
    this.timeStarted = (new Date()).getTime();
    this.xLength = parseInt(this.yInput.value);
    this.yLength = parseInt(this.xInput.value);
    this.mineCount = parseInt(this.minesInput.value);
    this.minesLeft = this.mineCount;
    this.field.forEach((columns) => columns.forEach((value) => {
      value.remove();
      if(this.overlayMessage) this.overlayMessage.remove();
    }));
    this.updateSegmentDisplay();
    this.createBoard();
  }

  createBoard(){
    requestAnimationFrame(
      () => (ipcRenderer.send('resize-to-content', JSON.stringify({x: this.clientWidth, y: this.clientHeight})))
    );
    this.setAttribute('style', 
      `--x-length: ${this.xLength}; --y-length: ${this.yLength}; ${this.xOverflow ? this.marginOverflow : this.marginNoOverflow}`
    );
    this.field = [...Array(this.xLength)].map(value => [...Array(this.yLength)]);

    this.firstClick = false;

    this.field.forEach((yField, xPos) => yField.forEach((value, yPos) => {
      let field = document.createElement('div');
      field.className = `${xPos}-row ${yPos}-col field`;
      field.xPos = xPos;
      field.yPos = yPos;
      this.field[xPos][yPos] = field;
      field.addEventListener('click', (event) => {
        if(!this.firstClick){ 
          this.placeMines(xPos, yPos)
          this.firstClick = true;
        };
        if(!field.flag){
          field.pressed = true;
          field.classList.add('pressed');
          let suroundingBombs = this.calculateSurroundingBombs(xPos, yPos);
          field.innerHTML = field.bomb ? `<span>${field.bomb}</span>` : `<span>${suroundingBombs}</span>`;
          if(suroundingBombs === 0){
            this.checkAdjecentForZero(xPos, yPos);
          }
          if(field.bomb){
            this.hitBomb()
          }
        }
        
      });
      field.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        if(!field.pressed){
          if(!field.flag && !field.speculation){
            field.flag = true;
            field.speculation = false;
            this.minesLeft -= 1;
            console.log(this.minesLeft);
            requestAnimationFrame(() => this.updateSegmentDisplay());
            field.classList.add('flagged');
            field.classList.remove('speculation');
            field.innerHTML = `<span>&#9873;</span>`;
            if(this.checkVictory()) this.gameOver(true)
          } else if (field.flag && !field.speculation) {
            field.flag = false;
            field.speculation = true;
            this.minesLeft += 1;
            requestAnimationFrame(() => this.updateSegmentDisplay());
            field.classList.remove('flagged');
            field.classList.add('speculation');
            field.innerHTML = `<span>&#9873;</span>`;  
          } else {
            field.flag = false;
            field.speculation = false;
            field.classList.remove('flagged');
            field.classList.remove('speculation');
            field.innerHTML = '';
          }
        }        
      })
      this.append(field);
    }));
  }

  updateSegmentDisplay(){
    let segmentString = this.minesLeft < 0 ? this.minesLeft.toFixed(0).padStart(3, ' ') : this.minesLeft.toFixed(0).padStart(3, '0');
    this.segmentDisplays.forEach((display, index) => {
      display.setAttribute('digit', segmentString.charAt(index) == '-' ? '-1' : segmentString.charAt(index));
    });
  }

  updateTimeSegmentDisplay(){
    let timePassed = Math.floor((parseInt((new Date()).getTime()) - parseInt(this.timeStarted)) / 1000).toFixed(0).padStart(3, '0');
    this.timeSegmentDisplays.forEach((display, index) => {
      display.setAttribute('digit', parseInt(timePassed) > 999 ? '9' : timePassed.charAt(index))
    })
  }

  connectedCallback(){
    let self = this;
    this.timeStarted = (new Date()).getTime();
    this.yLength = parseInt(this.getAttribute('x'));
    this.xLength = parseInt(this.getAttribute('y'));
    this.mineCount = parseInt(this.getAttribute('mines'));
    this.minesLeft = this.mineCount;

    ipcRenderer.on('resize-to-content-reply', (event, arg) => {
      let answer = JSON.parse(arg);

      this.xOverflow = answer.xOverflow;

      this.setAttribute('style', 
        `--x-length: ${this.xLength}; --y-length: ${this.yLength}; ${this.xOverflow ? this.marginOverflow : this.marginNoOverflow}`
      );
    })

    this.createBoard();
    this.createControlUI();
  }
}

customElements.define('mine-sweeper', MineSweeper);