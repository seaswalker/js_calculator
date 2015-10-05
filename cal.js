var cal = {
	"mouseHoverColor": "#CFCFCF",
	"mouseOutColor": "#E6E6E6",
	"firstMouseOutColor": "#F2F2F2",
	"showInput": null,
	"preStep": null,
	//二元运算符
	"binaryOperator": null
};

window.onload = function() {
	init();
	keyHover();
	clearAll();
	back();
	ce();
};

function init() {
	cal.showInput = document.getElementById("show-input");
	cal.preStep = document.getElementById("pre-step");
}

/**
 * [clearAll 重置所有]
 */
function clearAll() {
	document.getElementById("clear-all").onclick = function() {
		cal.showInput.innerHTML = "0";
		cal.preStep.innerHTML = "&nbsp;";
		cal.binaryOperator = null;
	}
}

/**
 * [back 设置退格键]
 */
function back() {
	document.getElementById("back").onclick = function() {
		var oldValue = cal.showInput.innerText;
		if (oldValue.length < 2) {
			var newValue = "";
			newValue = "0";
		} else {
			newValue = oldValue.substring(0, oldValue.length - 1);
		}
		cal.showInput.innerHTML = newValue;
	}
}

/**
 * [ce 清空showInput]
 */
function ce() {
	document.getElementById("ce").onclick = function() {
		cal.showInput.innerHTML = "0";
	}
}

/**
 * [handleKey 处理按键按下事件]
 * @param value 键值
 */
function handleKey(value) {
	if (!isNaN(value) || value === ".") {
		showInput(value);
	} else {
		switch (value) {
			case "±":
				unaryOperate(value, function(v) {
					var oldValue = cal.showInput.innerText;
					if (oldValue === "0") {
						return oldValue;
					}
					if (oldValue.charAt(0) === '-') {
						return oldValue.substring(1);
					} else {
						return "-" + oldValue;
					}
				});
				break;
			case "√":
				unaryOperate(value, function(v) {
					var result = Math.sqrt(cal.showInput.innerText);
					return checkLength(result);
				});
				break;
			case "x²":
				unaryOperate(value, function(v) {
					var result = Math.pow(cal.showInput.innerText, 2);
					return checkLength(result);
				});
				break;
			case "½":
				unaryOperate(value, function(v) {
					var oldValue = cal.showInput.innerText;
					if (oldValue === "0") {
						return "0不能作为除数";
					}
					var result = 1 / oldValue;
					return checkLength(result);
				});	
				break;
			case "+":
			case "-":
			case "%":
				binaryOperate(value);
				break;
			case "×":
				binaryOperate("*");
				break;
			case "÷":
				binaryOperate("/");
				break;
			case "=":
				calculate();
				break;
		}
	}
}

/**
 * [checkLength 确保结果长度不大于13]
 */
function checkLength(value) {
	var valueStr = value + "";
	if (valueStr.length > 12) {
		//转化为2位小数的指数计数法
		value = value.toExponential(2);
	}
	return value;
}

/**
 * [unaryOperate 执行一元运算]
 * 比如取反、取余
 */
function unaryOperate(value, operation) {
	cal.showInput.innerHTML = operation(value);
}

/**
 * [binaryOperate 二元操作]
 * 存在两种情况:
 * a) 如果之前输入过操作符，那么首先计算第一步操作
 * b) 如果之前没有，那么需要把第一个操作数和运算符显示到pre-step
 */
function binaryOperate(operator, operation) {
	if (cal.binaryOperator === null) {
		cal.preStep.innerHTML = cal.showInput.innerText + " " + operator;
	} else {
		//计算上一步
		cal.preStep.innerHTML = eval(cal.preStep.innerText + cal.showInput.innerText) + " " + operator;
	}
	cal.binaryOperator = operator;
	cal.showInput.innerHTML = "0";
}

/**
 * [calculate 按下=时计算最终结果]
 */
function calculate() {
	cal.showInput.innerHTML = checkLength(eval(cal.preStep.innerText + cal.showInput.innerText));
	cal.preStep.innerHTML = "&nbsp;";
	cal.binaryOperator = null;
}

/**
 * [showInput 显示输入内容]
 */
function showInput(value) {
	var oldValue = cal.showInput.innerText;
	var newValue = oldValue;
	if (oldValue === "0" && value !== ".") {
		newValue = value;
	}
	//只支持13位数
	else if (oldValue.length < 13) {
		newValue += value;	
	}
	cal.showInput.innerHTML = newValue;
}

//按键鼠标悬浮效果
function keyHover() {
	var lis = document.getElementsByTagName("li");
	var key = null;
	for (var i = 0;i < lis.length;i ++) {
		key = lis[i];
		key.onmouseover = function() {
			this.style.backgroundColor = cal.mouseHoverColor;
		};
		key.onmouseout = _helper(i, key);
		key.onclick = function() {
			handleKey(this.innerText);
		};
	}
	function _helper(i, li) {
		return function() {
			li.style.backgroundColor =  i < 4 ? cal.firstMouseOutColor : cal.mouseOutColor;
		};
	}
}