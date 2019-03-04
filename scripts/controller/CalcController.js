/*jshint esversion: 6 */
/*jshint -W061 */
class CalcController {
	constructor(){
		this._audio 		= new Audio('./audio/click.mp3');
		this._audioOnOff	= false;
		this._lastOperator  = '';
		this._lastResult	= '';
		this._operation		= [];
		this._locale		= 'pt-BR';
		this._displayCalcEl = document.querySelector("#display");
		this._displayHistEl = document.querySelector("#displayHistory");
		this._dateEl 		= document.querySelector("#data");
		this._timeEl 		= document.querySelector("#hora");
		this._currentDate	= '';
		this.initialize();
		this.initButtonsEvents();
		this.initKeyboard();
	}
	pasteFromClipboard(){
		document.addEventListener('paste', e=>{
			let textDisplay = e.clipboardData.getData('Text');
			this.displayCalc = parseFloat(textDisplay);
			console.warn(textDisplay);
		});
	}
	copyToClipboard(){
		let inputDisplay = document.createElement('input');
		inputDisplay.value = this.displayCalc;
		document.body.appendChild(inputDisplay);
		inputDisplay.select();
		document.execCommand("Copy");
		inputDisplay.remove();
	}
	toggleAudio(){
		if (this._audioOnOff) {
			this._audioOnOff = false;
			this.displayHistory = 'AUDIO OFF';
			this.playAudio();
		} else {
			this._audioOnOff = true;
			this.displayHistory = 'AUDIO ON';
			this.playAudio();
		}
	}
	playAudio(){
		if (this._audioOnOff) {
			this._audio.currentTime = 0;
			this._audio.play();
		}
	}
	initialize() {
		this.setDisplayDateTime();
		
		setInterval(() => {
			this.setDisplayDateTime();
		}, 1000);
		
		this.setLastNumberToDisplay();
		this.pasteFromClipboard();
		
		document.querySelectorAll('.btn-ac').forEach(btn => {
			btn.addEventListener('dblclick', e => {
				this.toggleAudio();
			});
		});
	}
	initKeyboard(){
		document.addEventListener('keyup', e =>{
			// console.warn('code: ' + e.code + '\nkey: ' + e.key + '\nctrKey: ' + e.ctrlKey + '\nshiftKey: ' + e.shiftKey);
			this.playAudio();
			
			switch (e.key) {
				case 'Escape':
					this.clearAll();
					break;
				case 'Backspace':
					this.clearEntry();
					break;
				case '%':
				case '/':
				case '*':
				case '-':
				case '+':
					this.addOperation(e.key);
					break;
				case 'Enter':
				case '=':
					this.calcSubTotal();
					break;
				case '.':
				case ',':
					this.addDot();
					break;
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					this.addOperation(parseFloat(e.key));
					break;
				case 'c':
					if(e.ctrlKey) this.copyToClipboard();
					break;
			}
		});
	}
	addEventListenerAll(element, events, fn){
		events.split(' ').forEach(event => {
			element.addEventListener(event, fn, false);
		});
	}
	clearAll(){
		this._operation = [];
		this._lastOperator = '';
		this._lastResult = '';
		this.setLastNumberToDisplay();
	}
	clearEntry(){
		this._operation.pop();
		this.setLastNumberToDisplay();
	}
	getLastOperation(){
		return this._operation[this._operation.length-1];
	}
	setLastOperation(value){
		this._operation[this._operation.length - 1] = value;
	}
	isOperator(value){
		return (['+','-','*','%','/'].indexOf(value) > -1); 
	}
	pushOperation(value){
		this._operation.push(value);
		
		if (this._operation.length > 3) {
			this.calcSubTotal();
		}
	}
	getResult(){
		try {
			return eval(this._operation.join(''));
		} catch (e){
			setTimeout(() => {
				this.setError();
			}, 1);
		}
	}
	calcSubTotal(){
		let last = '';
		let result = 0;
		
		this._lastOperator = this.getLastItem();

		if (this._operation.length < 3) {
			let firstItem = this._operation[0];
			this._operation = [firstItem, this._lastOperator, this._lastResult];
		}
			
		if (this._operation.length > 3) {
			last = this._operation.pop();
			this._lastResult = this.getResult();
		} else if (this._operation.length == 3) {
			this._lastResult = this.getLastItem(false);
		}
		
		if (this.getResult()) {
			result = this.getResult();
		}
		
		if (last == '%') {
			let firstNumber = this._operation[0];
			let operator 	= this._operation[1];
			let lastNumber 	= this._operation[2];
			result = eval(`${firstNumber} ${operator} (${(firstNumber/100)*lastNumber})`);
			result = parseFloat(result.toFixed(5));
			this._operation = [result];
			this.setLastNumberToDisplay();
		} else {
			result = parseFloat(result.toFixed(5));
			this._operation = [result];
			if (last) this._operation.push(last);
			this.setLastNumberToDisplay();
		}
	}
	getLastItem(isOperator = true){
		let lastItem;

		for (let i = this._operation.length - 1; i >= 0; i--) {
			if (this.isOperator(this._operation[i]) == isOperator) {
				lastItem = this._operation[i];
				break;
			}
		}
		
		if (!lastItem) {
			lastItem = (isOperator) ? this._lastOperator : this._lastResult;
		}

		return lastItem;
	}
	setLastNumberToDisplay(){
		let lastNumber = this.getLastItem(false);

		this.displayHistory = this._operation.join(' ');

		if (lastNumber && (this._operation.length > 0)) {
			this.displayCalc = lastNumber;
		} else {
			this.displayCalc = '0';
		}
	}
	addOperation(value){
		
		if (isNaN(this.getLastOperation())) {
			// string
			if(this.isOperator(value)) {
				this.setLastOperation(value);
			} else {
				this.pushOperation(value);
				this.setLastNumberToDisplay();
			}
		} else {
			// number
			if (this.isOperator(value)) {
				this.pushOperation(value);
				this.setLastNumberToDisplay();
			} else {
				let newValue = this.getLastOperation().toString() + value.toString();
				this.setLastOperation(newValue);
				this.setLastNumberToDisplay();
			}
		}
	}
	addDot(){
		let lastOperation =  this.getLastOperation();
		
		if (typeof lastOperation === 'string' && lastOperation.split('').indexOf('.') > -1) return;
		
		if (this.isOperator(lastOperation) || !lastOperation) {
			this.pushOperation('0.');
		} else {
			this.setLastOperation(lastOperation.toString() + '.');

		}
		this.setLastNumberToDisplay();
	}
	setError(){
		this.displayCalc = "ERROR";
		this.displayHistory = "";
	}
	execBtn(value){
		this.playAudio();
		
		switch (value) {
			case 'ac':
				this.clearAll();
				break;
			case 'ce':
				this.clearEntry();
				break;
			case 'porcento':
				this.addOperation('%');
				break;
			case 'divisao':
				this.addOperation('/');
				break;
			case 'multiplicacao':
				this.addOperation('*');
				break;
			case 'subtracao':
				this.addOperation('-');
				break;
			case 'soma':
				this.addOperation('+');
				break;
			case 'igual':
				this.calcSubTotal();
				break;
			case 'ponto':
				this.addDot();
				break;
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				this.addOperation(parseFloat(value));
				break;
			default:
				this.setError();
				break;
		}
	}
	initButtonsEvents(){
		let buttons = document.querySelectorAll("#buttons > g, #parts > g");

		buttons.forEach((btn, index)=>{
			// btn.addEventListener('click', e => {
			this.addEventListenerAll(btn, 'onmouserover mouseup mousedown', e => {
				btn.style.cursor = "pointer";
			});
			this.addEventListenerAll(btn, 'click drag', e => {
				let textBtn = btn.className.baseVal.replace("btn-", "");
				this.execBtn(textBtn);
			});
		});
	}
	setDisplayDateTime(){
		this.displayDate = this.currentDate.toLocaleDateString(this._locale);
		// this.displayDate = this.currentDate.toLocaleDateString(this._locale,{
		// 	day: '2-digit',
		// 	month: 'short',
		// 	year: 'numeric'
		// });
		this.displayTime = this.currentDate.toLocaleTimeString(this._locale);
	}
	get displayTime(){
		return this._timeEl.innerHTML;
	}
	set displayTime(value){
		this._timeEl.innerHTML = value;
	}
	get displayDate(){
		return this._dateEl.innerHTML;
	}
	set displayDate(value){
		this._dateEl.innerHTML = value;
	}
	get displayCalc(){
		return this._displayCalcEl.innerHTML;
	}
	set displayCalc(value){
		if (value.toString().length > 10) {
			value = parseFloat(value);
			value = value.toExponential(4);
		}
		this._displayCalcEl.innerHTML = value;
	}
	get displayHistory() {
		return this._displayHistEl.innerHTML;
	}
	set displayHistory(value) {
		this._displayHistEl.innerHTML = value;
	}
	get currentDate(){
		return new Date();
	}
	set currentDate(value){
		this._currentDate	= value;
	}
}