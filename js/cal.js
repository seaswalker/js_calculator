window.onload = function() {
    Calculator.initCache();
    Calculator.initListeners();
}

//全局计算器对象
var Calculator = (function() {
	var cal = {
		//常量
		constants: {
			//鼠标悬停时的颜色
			mouseHoverColor: "#CFCFCF",
			//计算器第一行和下面其它行的颜色是不同的，这个是第一行的背景颜色
			firstMouseOutColor: "#F2F2F2",
			//剩余各行的背景颜色
			mouseOutColor: "#E6E6E6"
		},
		cache: {
			//输入内容显示元素
			showInput: null,
			//上一步计算结果显示区域
			preStep: null
		},
        //操作符映射，为了解决显示时使用X而运算时使用*的问题(示例)
        operatorMapper: {
            "+": "+",
            "-": "-",
            "×": "*",
            "%": "%",
            "÷": "/"
        },
        //运算符栈
        operatorStack: [],
        //如果为true，那么接下来输入的数字需要覆盖在showInput上，而不是追加
        isOverride: false,
        //辅助判断运算符的优先级
        operatorPriority: {
            "+": 1,
            "-": 1,
            "*": 2,
            "%": 2,
            "/": 2
        },
        /**
         * 初始化缓存对象(cal.cache)
         */
        initCache: function() {
            cal.cache.showInput = document.getElementById("show-input");
            cal.cache.preStep = document.getElementById("pre-step");
        },
		//初始化事件监听器
		initListeners: function() {
			//清空键(即C)
			cal.addEvent(document.getElementById("clear-all"), "click", function() {
				cal.cache.showInput.innerHTML = "0";
				cal.cache.preStep.innerHTML = "&nbsp;";
				cal.cache.binaryOperator = null;
			});
			//退格键("Back")
			cal.addEvent(document.getElementById("back"), "click", function() {
				var oldValue = cal.cache.showInput.innerText;
				cal.cache.showInput.innerHTML = oldValue.length < 2 ? "0" : oldValue.substring(0, oldValue.length - 1);
			});
			//CE键(只清空show-input元素)
            cal.addEvent(document.getElementById("ce"), "click", function() {
                cal.cache.showInput.innerHTML = "0";
            });
            var lis = document.getElementsByTagName("li"), key;
            for (var i = 0, l = lis.length;i < l;i ++) {
                key = lis[i];
                //按键鼠标悬浮变色效果
                cal.addEvent(key, "mouseover", function() {
                    this.style.backgroundColor = cal.constants.mouseHoverColor;
                });
                //鼠标移出后颜色变回正常
                cal.addEvent(key, "mouseout", _helper(i, key));
                //按键点击事件
                cal.addEvent(key, "click", function() {
                    cal.handleKey(this.innerText);
                });
            }
            function _helper(i, li) {
                return function() {
                    li.style.backgroundColor =  i < 4 ? cal.constants.firstMouseOutColor : cal.constants.mouseOutColor;
                };
            }
		},
        /**
         * 相应按键按下事件
         * @param value 按键的内容(innerText)
         */
        handleKey: function(value) {
            //如果是一个数字或者小数点，直接显示出来
            if (!isNaN(value) || value === ".") {
                cal.showInput(value);
            } else {
                switch (value) {
                    case "±":
                        cal.unaryOperate(function() {
                            var oldValue = cal.cache.showInput.innerText;
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
                        cal.unaryOperate(function() {
                            var result = Math.sqrt(cal.cache.showInput.innerText);
                            return cal.checkLength(result);
                        });
                        break;
                    case "x²":
                        cal.unaryOperate(function() {
                            var result = Math.pow(cal.cache.showInput.innerText, 2);
                            return cal.checkLength(result);
                        });
                        break;
                    case "½":
                        cal.unaryOperate(function() {
                            var oldValue = cal.cache.showInput.innerText;
                            if (oldValue === "0") {
                                return "0不能作为除数";
                            }
                            var result = 1 / oldValue;
                            return cal.checkLength(result);
                        });
                        break;
                    case "+":
                    case "-":
                    case "÷":
                    case "×":
                    case "%":
                        cal.isOverride = true;
                        cal.binaryOperate(cal.operatorMapper[value]);
                        break;
                    case "=":
                        cal.calculate();
                        break;
                }
            }
        },
        /**
         * 执行一元运算 比如取反、取余
         * @param operation 具体运算回调函数
         */
        unaryOperate: function(operation) {
            cal.cache.showInput.innerHTML = operation();
        },
        /**
         * 二元操作(+ - * / %)
         * @param operator 操作符
         */
        binaryOperate: function(operator) {
            var preOperator = cal.operatorStack.pop(),
                si = cal.cache.showInput.innerHTML;
            if (preOperator == null) {
                cal.cache.preStep.innerHTML = (si + " " + operator);
            }
            //当前运算符不是第一个并且优先级<=前一个运算符时需要运算出之前一步的结果显示在showInput上
            else if (cal.operatorPriority[operator] <= cal.operatorPriority[preOperator]) {
                cal.cache.showInput.innerHTML = cal.checkLength(eval(cal.cache.preStep.innerHTML + si));
                cal.cache.preStep.innerHTML += (" " + si + " " + operator);
            } else {
                cal.cache.preStep.innerHTML += (" " + si + " " + operator);
            }
            //将操作符入栈
            cal.operatorStack.push(operator);
        },
        /**
         * 按下=时计算最终结果
         */
        calculate: function() {
            cal.cache.showInput.innerHTML = cal.checkLength(eval(cal.cache.preStep.innerText + cal.cache.showInput.innerText));
            cal.cache.preStep.innerHTML = "&nbsp;";
            //运算符栈复位
            cal.operatorStack = [];
            cal.isOverride = true;
        },
        /**
         * 确保结果长度不大于13,如果超出，以科学计数法形式显示(小数点后7位)
         * @param value 需要检查的结果
         */
        checkLength: function(value) {
            //注意取出尾部的0
            var valueStr = (value + "").replace(/0+$/, "");
            return valueStr.length > 12 ? value.toExponential(7) : valueStr;
        },
        /**
         * 显示输入的内容
         * 用于相应数字/小数点按键
         * @param value 按键的内容
         */
        showInput: function(value) {
            var oldValue = cal.cache.showInput.innerText;
            var newValue = oldValue;
            if (cal.isOverride) {
                //既然是覆盖，那么如果直接输入.那么肯定是0.x
                if (value === ".") {
                    newValue = "0.";
                } else {
                    newValue = value;
                }
            } else if (oldValue.length < 13) {
                if (oldValue === "0") {
                    if (value === ".") {
                        newValue = "0.";
                    } else {
                        newValue = value;
                    }
                }  else {
                    newValue += value;
                }
            }
            cal.cache.showInput.innerHTML = newValue;
            cal.isOverride = false;
        },
        /**
         * 工具方法，为element添加事件处理函数
         * @param element 需要添加事件的dom元素
         * @param name name事件名称(不含on)
         * @param handler 事件处理函数
         */
        addEvent: function(element, name, handler) {
            if (window.addEventListener) {
                element.addEventListener(name, function(event) {
                    handler.call(element, event);
                }, true);
            } else if (window.attachEvent) {
                element.attachEvent("on" + name, function(event) {
                    handler.call(element, event);
                });
            }
        }
	};
	return cal;
})();