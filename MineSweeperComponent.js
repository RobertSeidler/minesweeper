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

    this.elements = {
      field: [],
      overlayMessage: document.createElement('div'),
      xInput: document.createElement('input'),
      yInput: document.createElement('input'),
      minesInput: document.createElement('input'),
      segmentDisplays: [
        document.createElement('seven-segment-digit'), 
        document.createElement('seven-segment-digit'), 
        document.createElement('seven-segment-digit')
      ],
      timeSegmentDisplays: [
        document.createElement('seven-segment-digit'), 
        document.createElement('seven-segment-digit'), 
        document.createElement('seven-segment-digit')
      ],
    };

    this.dynamicStyles = {
      marginNoOverflow: 
        'top: 0%;' + 
        'left: 50%;' + 
        '--margin-left: calc( -1 * calc(var(--y-length) * 2rem + (var(--y-length) + 1) * 1px) /2);' + 
        '--margin-top: calc( -1 * calc(var(--x-length) * 2rem + (var(--x-length) + 1) * 1px) /2);',
      marginOverflow: 
        '--margin-top: 0px; top: 0px; --margin-left: 0px; left: 0px;',
    };
  }

  calculateSurroundingBombs(xPos, yPos){
    let surroundingBombs = 0;
    forEachAdjecent(xPos, yPos, this.xLength, this.yLength, (x, y) => (surroundingBombs += this.elements.field[x][y].bomb ? 1 : 0));
    return surroundingBombs;
  }

  placeMines(xPosClicked, yPosClicked){
    [...Array(this.mineCount)].forEach(() => {
      let minePlaced = false;
      while(!minePlaced){
        let xMinePos = Math.floor(Math.random() * this.xLength);
        let yMinePos = Math.floor(Math.random() * this.yLength);

        if(!(xPosClicked == xMinePos && yPosClicked == yMinePos) && this.elements.field[xMinePos][yMinePos].bomb != '&#9728;') {
          this.elements.field[xMinePos][yMinePos].bomb = '&#9728;';
          minePlaced = true;
        }
      }
    })
  }

  checkAdjecentForZero(xPos, yPos){
    let adjecentSpaces = []
    forEachAdjecent(xPos, yPos, this.xLength, this.yLength, (x, y) => {
      if(!this.elements.field[x][y].classList.contains('pressed')){
        this.elements.field[x][y].classList.add('pressed');
        this.elements.field[x][y].pressed = true;
        let surroundingBombs = this.calculateSurroundingBombs(x, y);
        this.elements.field[x][y].innerHTML = `<span class="adj-${surroundingBombs}">${surroundingBombs === 0 ? ' ' : surroundingBombs}</span>`;
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

    this.elements.field.forEach(columns => columns.forEach(field => {
      if(!field.bomb && field.flag) victory = false;
      if(field.bomb && field.pressed) victory = false;
      if(!field.bomb && !field.pressed) victory = false;
    }));

    return victory;
  }

  gameOver(won){
    this.elements.overlayMessage.className = `overlay ${won ? 'won' : 'lost'}`;
    this.elements.overlayMessage.innerHTML = won ? '<span class="end-emoji">&#10003;</span><br/>won' : '<span class="end-emoji">&#10040;</span><br/>lost'; 
    this.elements.overlayMessage.addEventListener('dblclick', (event) => { this.resetGame(); });
    clearInterval(this.timePassedInterval);
    this.append(this.elements.overlayMessage);
  }

  hitBomb(){
    this.elements.field.forEach((col, xPos) => col.forEach((field, yPos) => {
      let suroundingBombs = this.calculateSurroundingBombs(xPos, yPos);
      field.pressed = true;
      field.classList.add('pressed');
      field.innerHTML = field.bomb ? 
        `<span style="color: black;">${field.bomb}</span>` : `<span class="adj-${suroundingBombs}">${suroundingBombs === 0 ? 
          ' ' : suroundingBombs}</span>`;
    }));
    this.gameOver(false);
  }

  createControlContainer(){
    let controls = document.createElement('div');
    controls.className = 'control';
    return controls;
  }

  createResetBtn(){
    let resetBtn = document.createElement('button');
    resetBtn.className = 'reset-btn ctrl';
    resetBtn.innerHTML = 'Reset';
    resetBtn.addEventListener('click', (event) => { this.resetGame(); });
    return resetBtn;
  }

  createXInput(){
    let xInput = this.elements.xInput;
    xInput.className = 'x-in ctrl';
    xInput.type = 'number';
    xInput.value = 10;
    xInput.min = 7;
    return xInput;
  }
  
  createXInputLabel(){
    let xInputLabel = document.createElement('div');
    xInputLabel.className = 'x-in-label ctrl-label';
    xInputLabel.innerHTML = '<span>Width:</span>';
    return xInputLabel;
  }

  createYInput(){
    let yInput = this.elements.yInput;
    yInput.className = 'y-in ctrl';
    yInput.type = 'number';
    yInput.value = 10;
    yInput.min = 7;
    return yInput;
  }
  
  createYInputLabel(){
    let yInputLabel = document.createElement('div');
    yInputLabel.className = 'y-in-label ctrl-label';
    yInputLabel.innerHTML = '<span>Height:</span>';
    return yInputLabel;
  }
  
  createMinesInput(){
    let minesInput = this.elements.minesInput;
    minesInput.className = 'mines-in ctrl';
    minesInput.type = 'number';
    minesInput.value = 15;
    minesInput.min = 1;
    return minesInput;
  }

  createMinesInputLabel(){
    let minesInputLabel = document.createElement('div');
    minesInputLabel.className = 'mines-in-label ctrl-label';
    minesInputLabel.innerHTML = '<span>Mines:</span>';
    return minesInputLabel;
  }


  createControlUI(){
    let controls = this.createControlContainer();
    let xInput = this.createXInput();
    let yInput = this.createYInput();
    let minesInput = this.createMinesInput();

    xInput.addEventListener('change', (event) => {
      minesInput.max = xInput.value * yInput.value - 1;
    });
    yInput.addEventListener('change', (event) => {
      minesInput.max = xInput.value * yInput.value - 1;
    });

    minesInput.max = xInput.value * yInput.value - 1;
 
    controls.append(xInput, yInput, minesInput, this.createResetBtn());
    controls.append(this.createXInputLabel(), this.createYInputLabel(), this.createMinesInputLabel());
    
    this.append(controls);
    controls.append(...this.createSevenSegmentDisplays());
    this.updateSegmentDisplay();
  }

  createSevenSegmentDisplays(){
    let result = [];
    let minesLeftSegment = document.createElement('div');
    let timePassedSegment = document.createElement('div');
    
    minesLeftSegment.className = 'segment-display-container mines-left';
    timePassedSegment.className = 'segment-display-container time-passed';

    this.elements.segmentDisplays.forEach((segmentDisplay, index) => {
      segmentDisplay.className = `segment-digit segment-${index}`;
      minesLeftSegment.append(segmentDisplay);
    });

    this.elements.timeSegmentDisplays.forEach((segmentDisplay, index) => {
      segmentDisplay.className =  `segment-digit segment-time-${index}`;
      timePassedSegment.append(segmentDisplay);
    });

    this.timePassedInterval = setInterval(this.updateTimeSegmentDisplay.bind(this), 1000);

    result.push(minesLeftSegment);
    result.push(timePassedSegment);

    return result;
  }

  resetGame(){
    this.timeStarted = (new Date()).getTime();
    this.timePassedInterval = setInterval(this.updateTimeSegmentDisplay.bind(this), 1000);
    this.xLength = parseInt(this.elements.yInput.value);
    this.yLength = parseInt(this.elements.xInput.value);
    this.mineCount = parseInt(this.elements.minesInput.value);
    this.minesLeft = this.mineCount;
    this.elements.field.forEach((columns) => columns.forEach((value) => {
      value.remove();
      if(this.elements.overlayMessage) this.elements.overlayMessage.remove();
    }));
    this.updateSegmentDisplay();
    this.createBoard();
  }

  fieldLeftClickHandler(field){
    if(!this.firstClick){ 
      this.placeMines(field.xPos, field.yPos)
      this.firstClick = true;
    };
    if(!field.flag && !field.speculation){
      field.pressed = true;
      field.classList.add('pressed');
      let suroundingBombs = this.calculateSurroundingBombs(field.xPos, field.yPos);
      field.innerHTML = field.bomb ? `<span>${field.bomb}</span>` : `<span class="adj-${suroundingBombs}">${suroundingBombs === 0 ? ' ' : suroundingBombs}</span>`;
      if(suroundingBombs === 0){
        this.checkAdjecentForZero(field.xPos, field.yPos);
      }
      if(field.bomb){
        this.hitBomb()
      }
      if(this.checkVictory()) this.gameOver(true)
    }
  }

  setRedFlag(field){
    field.flag = true;
    field.speculation = false;
    this.minesLeft -= 1;
    console.log(this.minesLeft);
    requestAnimationFrame(() => this.updateSegmentDisplay());
    field.classList.add('flagged');
    field.classList.remove('speculation');
    field.innerHTML = `<span>&#9873;</span>`;
    if(this.checkVictory()) this.gameOver(true);
  }

  setBlueFlag(field){
    field.flag = false;
    field.speculation = true;
    this.minesLeft += 1;
    requestAnimationFrame(() => this.updateSegmentDisplay());
    field.classList.remove('flagged');
    field.classList.add('speculation');
    field.innerHTML = `<span>&#9873;</span>`;
  }

  clearFlag(field){
    field.flag = false;
    field.speculation = false;
    field.classList.remove('flagged');
    field.classList.remove('speculation');
    field.innerHTML = '';
  }

  fieldRightClickHander(field){
    if(!field.pressed){
      if(!field.flag && !field.speculation){
        this.setRedFlag(field);
      } else if (field.flag && !field.speculation) {
        this.setBlueFlag(field);
      } else {
        this.clearFlag(field);
      }
    }
  }

  createBoard(){
    requestAnimationFrame(
      () => (ipcRenderer.send('resize-to-content', JSON.stringify({x: this.clientWidth, y: this.clientHeight})))
    );
    this.setAttribute('style', 
      `--x-length: ${this.xLength}; --y-length: ${this.yLength}; ${this.xOverflow ? this.dynamicStyles.marginOverflow : this.dynamicStyles.marginNoOverflow}`
    );
    this.elements.field = [...Array(this.xLength)].map(value => [...Array(this.yLength)]);

    this.firstClick = false;

    this.elements.field.forEach((yField, xPos) => yField.forEach((value, yPos) => {
      let field = document.createElement('div');
      field.className = `${xPos}-row ${yPos}-col field`;
      field.xPos = xPos;
      field.yPos = yPos;
      this.elements.field[xPos][yPos] = field;
      field.addEventListener('click', (event) => {
        this.fieldLeftClickHandler(field);
      });
      field.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        this.fieldRightClickHander(field);
      })
      this.append(field);
    }));
  }

  updateSegmentDisplay(){
    let segmentString = this.minesLeft < 0 ? this.minesLeft.toFixed(0).padStart(3, ' ') : this.minesLeft.toFixed(0).padStart(3, '0');
    this.elements.segmentDisplays.forEach((display, index) => {
      display.setAttribute('digit', segmentString.charAt(index) == '-' ? '-1' : segmentString.charAt(index));
    });
  }

  updateTimeSegmentDisplay(){
    let timePassed = Math.floor((parseInt((new Date()).getTime()) - parseInt(this.timeStarted)) / 1000).toFixed(0).padStart(3, '0');
    this.elements.timeSegmentDisplays.forEach((display, index) => {
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
        `--x-length: ${this.xLength}; --y-length: ${this.yLength}; ${this.xOverflow ? this.dynamicStyles.marginOverflow : this.dynamicStyles.marginNoOverflow}`
      );
    })

    this.createBoard();
    this.createControlUI();
  }
}

customElements.define('mine-sweeper', MineSweeper);