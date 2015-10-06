window.onload = function() {
    Calculator.initCache();
    Calculator.initListeners();
}

//全局计算器对象
var Calculator = (function() {
	var cal = {
        //计算器按键编码
        keyCodes: {
          0: '0',
          1: '1',
          2: '2',
          3: '3',
          4: '4',
          5: '5',
          6: '6',
          7: '7',
          8: '8',
          9: '9',
          10: '.',
          11: '±',
          12: '=',
          13: '+',
          14: '-',
          15: '*',
          16: '/',
          17: '%',
          18: '√',
          19: 'x2',
          20: '1/x',
          21: '(',
          22: ')',
          23: 'yroot',
          24: 'n!',
          25: 'Mod',
          26: '^',
          27: 'sin',
          28: 'cos',
          29: 'tan',
          30: 'powten',
          31: 'log',
          32: 'sinh',
          33: 'cosh',
          34: 'tanh',
          35: 'π',
          36: '↑'
        },
        //当前计算器的类型1 --> 标准型, 2-->科学型，默认标准型
        type: 1,
        //计算器类型前缀，用于从页面获取元素
        typePrefix: {
            1: "std-",
            2: "sci-"
        },
        //记录每个类型的计算器的事件监听是否已经绑定,key:typpe数值，value:默认标准型是true(已加载)
        hasInited: {
            1: true,
            2: false
        },
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
        //记录上次运算的结果
        preResult: 0,
        //记录上次的运算符
        preOperator: null,
        //记录上次的运算函数
        preCallback: null,
        //上一次输入是否是二元运算符，如果是并且再次输入二元运算符，那么忽略此次输入
        isPreInputBinaryOperator: false,
        //如果为true，那么接下来输入的数字需要覆盖在showInput上，而不是追加
        isOverride: false,
        //int校验
        intPattern: /^-?\d+$/,
        //小数校验
        floatPattern: /^-?\d+\.\d+$/,
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
            var prefix = cal.typePrefix[cal.type];
            cal.cache.showInput = document.getElementById(prefix + "show-input");
            cal.cache.preStep = document.getElementById(prefix + "pre-step");
        },
		//初始化事件监听器
		initListeners: function() {
            var prefix = cal.typePrefix[cal.type];
			//清空键(即C)
			cal.addEvent(document.getElementById(prefix + "clear-all"), "click", function() {
				cal.cache.showInput.innerHTML = "0";
				cal.cache.preStep.innerHTML = "&nbsp;";
                cal.preResult = 0;
			});
			//退格键("Back")
			cal.addEvent(document.getElementById(prefix + "back"), "click", function() {
				var oldValue = cal.cache.showInput.innerText;
				cal.cache.showInput.innerHTML = oldValue.length < 2 ? "0" : oldValue.substring(0, oldValue.length - 1);
			});
			//CE键(只清空show-input元素)
            cal.addEvent(document.getElementById(prefix + "ce"), "click", function() {
                cal.cache.showInput.innerHTML = "0";
            });
            //设置运算符事件监听
            var lis = document.getElementById(prefix + "top-symbol").getElementsByTagName("li");
            _helper(lis, cal.constants.firstMouseOutColor);
            //设置下面一栏数字、四则运算事件监听
            lis = document.getElementById(prefix + "num-symbol").getElementsByTagName("li");
            _helper(lis, cal.constants.mouseOutColor);
            //显示/隐藏计算器类型选择侧边栏
            var bar = document.getElementById(prefix + "type-bar");
            cal.addEvent(document.getElementById(prefix + "show-bar"), "click", function() {
                if (bar.style.display === "block") {
                    bar.style.display = "none";
                } else {
                    bar.style.display = "block";
                }
            });
            //为侧边栏下的li绑定切换类型事件
            lis = bar.getElementsByTagName("li");
            var li;
            for (var i = 0, l = lis.length;i < l;++ i) {
                li = lis[i];
                //非当前类型才有必要绑定事件
                if (li.className !== "active") {
                    cal.addEvent(li, "click", function() {
                        cal.switchType(parseInt(this.value));
                        //关闭侧边栏
                        bar.style.display = "none";
                    });
                }
            }

            /**
             * 辅助为li设置事件监听
             * @param lis li集合
             * @param mouseOutColor 鼠标移出是的颜色(这个的不同就是此函数存在的意义)
             * @private
             */
            function _helper(lis, mouseOutColor) {
                var key;
                for (var i = 0, l = lis.length;i < l;i ++) {
                    key = lis[i];
                    //按键鼠标悬浮变色效果
                    cal.addEvent(key, "mouseover", function() {
                        this.style.backgroundColor = cal.constants.mouseHoverColor;
                    });
                    //鼠标移出后颜色变回正常
                    cal.addEvent(key, "mouseout", function() {
                        this.style.backgroundColor = mouseOutColor;
                    });
                    //按键点击事件
                    cal.addEvent(key, "click", function() {
                        cal.handleKey(this.value);
                    });
                }
            }
		},
        /**
         * 相应按键按下事件
         * @param value 按键的value值(即其keyCode)
         */
        handleKey: function(value) {
            var keyCode = parseInt(value);
            //如果是一个数字或者小数点，直接显示出来
            if (keyCode < 11) {
                cal.showInput(cal.keyCodes[keyCode]);
            } else {
                switch (keyCode) {
                    //正负号
                    case 11:
                        cal.unaryOperate(function(oldValue) {
                            if (oldValue === "0") {
                                return [oldValue];
                            }
                            if (oldValue.charAt(0) === '-') {
                                return [oldValue.substring(1)];
                            } else {
                                return ["-" + oldValue];
                            }
                        });
                        break;
                    //开根下
                    case 18:
                        cal.unaryOperate(function(si) {
                            return [Math.sqrt(si), "sqrt"];
                        });
                        break;
                    //平方
                    case 19:
                        cal.unaryOperate(function(si) {
                            return [Math.pow(si, 2), "sqr"];
                        });
                        break;
                    //取倒数
                    case 20:
                        cal.unaryOperate(function(si) {
                            return [si === 0 ? "0不能作为被除数" : 1 / si, "1/"];
                        });
                        break;
                    //阶乘
                    case 24:
                        cal.unaryOperate(function(si) {
                            if (si < 0) {
                                si = (0 - si);
                            }
                            if (cal.isFloat(si + "")) {
                                si = Math.floor(si);
                            }
                            return [cal.fact(si), "fact"];
                        });
                        break;
                    //sin
                    case 27:
                        cal.unaryOperate(function(si) {
                           return [Math.sin(si), "sin"];
                        });
                        break;
                    //cos
                    case 28:
                        cal.unaryOperate(function(si) {
                           return [Math.cos(si), "cos"];
                        });
                        break;
                    //tan
                    case 29:
                        cal.unaryOperate(function(si) {
                            return [Math.tan(si), "tan"];
                        });
                        break;
                    //10的x次方
                    case 30:
                        cal.unaryOperate(function(si) {
                            return [Math.pow(10, si), "powten"];
                        });
                        break;
                    //log
                    case 31:
                        cal.unaryOperate(function(si) {
                            //js的Math.log是e的对数，Windows计算器是10的对数，此处参考Windows
                            return [Math.log10(si), "log"];
                        });
                        break;
                    //sinh(双曲正弦函数)
                    case 32:
                        cal.unaryOperate(function(si) {
                            return [Math.sinh(si), "sinh"];
                        });
                        break;
                    //cosh(双曲余弦函数)
                    case 33:
                        cal.unaryOperate(function(si) {
                            return [Math.cosh(si), "cosh"];
                        });
                        break;
                    //tanh(双曲余切函数)
                    case 34:
                        cal.unaryOperate(function(si) {
                            return [Math.tanh(si), "tanh"];
                        });
                        break;
                    //π
                    case 35:
                        cal.unaryOperate(function(si) {
                            return [Math.PI];
                        });
                        break;
                    //二元运算符开始
                    //加、减、乘、除、取余，运算比较简单，直接利用eval即可求值
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                    case 17:
                        if (cal.isPreInputBinaryOperator) {
                            break;
                        }
                        cal.isPreInputBinaryOperator = true;
                        cal.isOverride = true;
                        var operator = cal.keyCodes[keyCode];
                        cal.binaryOperate(operator, function(pr, po, si) {
                            return po == null ? si : eval(pr + po + si);
                        });
                        break;
                    case 12:
                        cal.calculate();
                        break;
                }
            }
        },
        /**
         * 执行一元运算 比如取反、取余
         * @param operation 具体运算回调函数
         * 会向operation传递一个参数si，为用户当前的输入，同时operation函数应该返回一个数组，数组的第一个
         * 元素是计算的结果，第二个元素示例sqrt，第二个参数可选
         */
        unaryOperate: function(operation) {
            var si = cal.cache.showInput.innerHTML, result;
            if (cal.isInteger(si)) {
                result = operation(parseInt(si));
            } else if (cal.isFloat(si)) {
                result = operation(parseFloat(si));
            }
            if (result != null) {
                cal.cache.showInput.innerHTML = cal.checkLength(result[0]);
                if (result.length > 1) {
                    cal.cache.preStep.innerHTML += (" " + result[1] + "(" + si + ")");
                }
                //一元运算结束后应该覆盖
                cal.isOverride = true;
            }
            cal.isPreInputBinaryOperator = false;
        },
        /**
         * 二元操作(+ - * / %)
         * @param operator 操作符
         * @param callback 回调函数，根据上一步的结果和此时的输入计算出新的结果
         * 接受三个参数:上两步的结果，上一步的运算符和当前输入
         */
        binaryOperate: function(operator, callback) {
            var si = cal.cache.showInput.innerHTML;
            if (cal.isNumber(si)) {
               cal.cache.preStep.innerHTML += (" " + si + " " + operator);
               //显示这一步的运算结果
               cal.cache.showInput.innerHTML = cal.preResult = callback(cal.preResult, cal.preOperator, si);
               cal.preOperator = operator;
               cal.preCallback = callback;
            }
        },
        /**
         * 按下=时计算最终结果
         */
        calculate: function() {
            var si = cal.cache.showInput.innerHTML;
            if (cal.isNumber(si)) {
                cal.cache.showInput.innerHTML = cal.checkLength(cal.preCallback(cal.preResult, cal.preOperator, si));
                cal.cache.preStep.innerHTML = "&nbsp;";
                cal.isOverride = true;
            }
        },
        /**
         * 确保结果长度不大于13,如果超出，以科学计数法形式显示(小数点后7位)
         * @param value 需要检查的结果
         */
        checkLength: function(value) {
            var valueStr = value + "";
            if (cal.isFloat(valueStr)) {
                valueStr = valueStr.replace(/0+$/, "");
            }
            return valueStr.length > 12 ? value.toExponential(7) : valueStr;
        },
        /**
         * 校验字符串是否是数字
         * @param str
         * @return 是返回true
         */
        isNumber: function(str) {
            return cal.isInteger(str) || cal.isFloat(str);
        },
        /**
         * 校验是否是整数
         * @param str
         */
        isInteger: function(str) {
            return str.match(cal.intPattern);
        },
        /**
         * 校验是否是小数
         * @param str
         */
        isFloat: function(str) {
            return str.match(cal.floatPattern);
        },
        /**
         * 显示输入的内容
         * 用于相应数字/小数点按键
         * @param value 按键的内容，不是keyCode
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
                } else {
                    newValue += value;
                }
            }
            cal.cache.showInput.innerHTML = newValue;
            cal.isOverride = false;
            cal.isPreInputBinaryOperator = false;
        },
        /**
         * 切换计算器类型
         * @param type int 要切换到的类型
         */
        switchType: function(type) {
            document.getElementById(cal.typePrefix[cal.type] + "main").style.display = "none";
            document.getElementById(cal.typePrefix[type] + "main").style.display = "block";
            cal.type = type;
            if (!cal.hasInited[type]) {
                cal.initListeners();
                cal.hasInited[type] = true;
            }
            cal.initCache();
            cal.preOperator = null;
            cal.preResult = 0;
            cal.isPreInputBinaryOperator = false;
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
        },
        /**
         * 阶乘
         * @param n 操作数 int
         * @return
         */
        fact: (function() {
            //缓存
            var cache = [1];
            function factorial(n) {
                var result = cache[n - 1];
                if (result == null) {
                    result = 1;
                    for (var i = 1;i <= n;++ i) {
                        result *= i;
                    }
                    cache[n - 1] = result;
                }
                return result;
            }
            return factorial;
        })()
	};
	return cal;
})();