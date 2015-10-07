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
          25: 'Exp',
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
          36: '↑',
          37: 'CE',
          38: 'C',
          39: 'Back'
        },
        //映射用于显示的操作符，比如计算时用*，而显示时x更好
        operatorFacade: {
            13: '+',
            14: '-',
            15: '×',
            16: '÷',
            17: '%',
            23: 'yroot',
            26: '^'
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
        //操作数栈
        operandStack: [],
        //运算符栈
        operatorStack: [],
        //上一次输入是否是二元运算符，如果是并且再次输入二元运算符，那么忽略此次输入
        isPreInputBinaryOperator: false,
        //上次按键是否是一元操作
        isPreInputUnaryOperator: false,
        //等号不可以连按
        isPreInputEquals: false,
        //如果为true，那么接下来输入的数字需要覆盖在showInput上，而不是追加
        //上一次计算的结果(=)
        preResult: 0,
        isOverride: false,
        //int校验
        intPattern: /^-?\d+$/,
        //小数校验
        floatPattern: /^-?\d+\.\d+$/,
        //科学计数法校验
        scientificPattern: /^\d+\.\d+e(\+|-)\d+$/,
        //辅助判断运算符的优先级
        operatorPriority: {
            ")": 0,
            "+": 1,
            "-": 1,
            "*": 2,
            "%": 2,
            "/": 2,
            "^": 3,
            "yroot": 3,
            "(": 4
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
                    //Exp 转为科学计数法表示
                    case 25:
                        cal.unaryOperate(function(si) {
                            return [si.toExponential(7)];
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
                    //x的y次方
                    case 26:
                    //开任意次方根
                    case 23:
                        if (cal.isPreInputBinaryOperator) {
                            break;
                        }
                        cal.isPreInputBinaryOperator = true;
                        cal.isOverride = true;
                        cal.binaryOperate(cal.keyCodes[keyCode], cal.operatorFacade[keyCode]);
                        break;
                    case 12:
                        cal.calculate();
                        break;
                    //ce
                    case 37:
                        cal.ce();
                        break;
                    //c
                    case 38:
                        cal.clear();
                        break;
                    //back
                    case 39:
                        cal.back();
                        break;
                    // (
                    case 21:
                        cal.cache.preStep.innerHTML += " (";
                        cal.operatorStack.push("(");
                        break;
                    // )
                    case 22:
                        cal.rightTag();
                        break;
                    //向上箭头，把上次计算结果显示出来
                    case 36:
                        cal.cache.showInput.innerHTML = cal.preResult;
                        break;
                }
            }
        },
        /**
         * 执行一元运算 比如取倒数、平方
         * @param operation 具体运算回调函数
         * 会向operation传递一个参数si，为用户当前的输入，同时operation函数应该返回一个数组，数组的第一个
         * 元素是计算的结果，第二个元素示例sqrt，第二个参数可选
         */
        unaryOperate: function(operation) {
            var si = cal.cache.showInput.innerHTML, result;
            if (cal.isInteger(si)) {
                result = operation(parseInt(si));
            } else if (cal.isFloat(si) || cal.isScientific(si)) {
                result = operation(parseFloat(si));
            }
            if (result != null) {
                cal.cache.showInput.innerHTML = cal.checkLength(result[0]);
                if (result.length > 1) {
                    //显示prestep有两种情况:
                    //第一种就是这是第一次(指连续调用的第一次)调用一元函数，此时直接接在末尾即可
                    if (!cal.isPreInputUnaryOperator) {
                        cal.cache.preStep.innerHTML += (" " + result[1] + "(" + si + ")");
                        cal.isPreInputUnaryOperator = true;
                    } else {
                        //第二种就是这不是第一次，那么应该截取最后一个空格之后的内容进行替换
                        //比如1 + 3 + sqrt(100)，那么应该从最后一个空格后替换为此次操作的内容
                        var pi = cal.cache.preStep.innerHTML;
                        pi = pi.substring(0, pi.lastIndexOf(" "));
                        pi += (" " + result[1] + "(" + si + ")");
                        cal.cache.preStep.innerHTML = pi;
                    }
                }
                //一元运算结束后应该覆盖
                cal.isOverride = true;
            }
            cal.isPreInputBinaryOperator = false;
        },
        /**
         * 二元操作(+ - * / %)
         * @param operator 操作符
         * @param facade 运算符门面，用于显示在preStep中
         */
        binaryOperate: function(operator, facade) {
            var si = cal.cache.showInput.innerHTML,
                pi = cal.cache.preStep.innerHTML;
            if (cal.isNumber(si)) {
                //压操作数栈
                cal.operandStack.push(si);
                //设置preStep有三种情况:第一种上一步不是一元操作，那么需要设置si，第二种是一元操作，那么由于一元操作会把
                //函数表达式(比如sqrt(100))设置到preStep，所以不需要再次设置si
                //第三种就是如果最后一位是右括号，那么也不需要设置si
                cal.cache.preStep.innerHTML += (cal.isPreInputUnaryOperator || pi.charAt(pi.length - 1) === ")")
                    ? (" " + facade) : (" " + si + " " + facade);
                var preOp = cal.operatorStack.pop();
                if (preOp != null) {
                    var op = cal.operatorPriority[operator],
                        pp = cal.operatorPriority[preOp];
                    //如果当前运算符优先级更高，那么只需压栈不需要计算
                    if (op > pp) {
                        cal.operatorStack.push(preOp);
                    }
                    //两者的优先级相等并且高于1，那么只需要计算一步
                    else if (op > 1 && op === pp) {
                        cal.operatorStack.push(preOp);
                        cal._travelStack(1);
                    }
                    else {
                        cal.operatorStack.push(preOp);
                        cal.cache.showInput.innerHTML = cal.checkLength(cal._travelStack(null, op));
                    }
                }
                cal.operatorStack.push(operator);
            }
            cal.isPreInputUnaryOperator = false;
            cal.isPreInputEquals = false;
        },
        /**
         * 按下=时计算最终结果
         */
        calculate: function() {
            if (!cal.isPreInputEquals) {
                var si = cal.cache.showInput.innerHTML, result;
                if (cal.isNumber(si)) {
                    cal.operandStack.push(si);
                    result = cal.checkLength(cal._travelStack());
                    cal.cache.showInput.innerHTML = result;
                    cal.preResult = result;
                    cal.cache.preStep.innerHTML = "&nbsp;";
                    cal.isOverride = true;
                }
                cal._reset();
                cal.isPreInputEquals = true;
            }
        },
        /**
         * 访问运算栈，返回计算结果
         * @param level 计算的层数，如果不指定，那么遍历整个栈
         * @param minPri(最小/截止优先级) 此参数针对下面的情况:
         * 2 + 2 X 3 X 2 ^ 2 X 2，由于最后一个运算符是X，优先级比^低，所以触发了对操作栈的遍历，但是不能全部遍历，应该遍历到第一个X停止
         * 如果不停止得到的将是错误的26 X 2 = 52，正确结果是2 + 24 X 2 = 50
         * @return Number
         * @private
         */
        _travelStack: function(level, minPri) {
            var op, f, s,
                //result取操作数栈栈顶，因为防止在下列情况9 X (6 + 时出现undefined
                result = cal.operandStack[cal.operandStack.length - 1],
                l = level || cal.operatorStack.length,
                p = minPri || 0;
            for (var i = 0;i < l;++ i) {
                op = cal.operatorStack.pop();
                //遇到minPri或左括号立即停止，左括号也需要再次压入，因为只有一个右括号才能抵消一个左括号
                if (cal.operatorPriority[op] < p || op === "(") {
                    cal.operatorStack.push(op);
                    break;
                }
                s = cal.operandStack.pop();
                f = cal.operandStack.pop();
                if (op === "^") {
                    result = Math.pow(f, s);
                } else if (op === "yroot") {
                    result = Math.pow(f, 1 / s);
                } else {
                    result = eval(f + op + s);
                }
                cal.operandStack.push(result);
            }
            return result;
        },
        /**
         * 输入了一个右括号
         */
        rightTag: function() {
            var si = cal.cache.showInput.innerHTML;
            if (cal.isNumber(si)) {
                cal.cache.preStep.innerHTML += (" " + si + " )");
                cal.operandStack.push(si);
                //遍历计算操作栈，直至遇到左括号
                var op = cal.operatorStack.pop(),
                    f, s, result;
                while (op !== "(" && op != null) {
                    s = cal.operandStack.pop();
                    f = cal.operandStack.pop();
                    if (op === "^") {
                        result = Math.pow(f, s);
                    } else if (op === "yroot") {
                        result = Math.pow(f, 1 / s);
                    } else {
                        result = eval(f + op + s);
                    }
                    cal.operandStack.push(result);
                    op = cal.operatorStack.pop();
                }
                //此处应该直接把小括号的计算内容弹出，因为此结果显示在了showInput中，而再次执行二元操作时会先有一个压栈的操作，
                // 并且执行=时也是根据showInput内容计算的
                cal.cache.showInput.innerHTML = cal.checkLength(cal.operandStack.pop());
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
        //CE
        ce: function() {
            cal.cache.showInput.innerHTML = "0";
        },
        //C
        clear: function() {
            cal.cache.showInput.innerHTML = "0";
            cal.cache.preStep.innerHTML = "&nbsp;";
            cal._reset();
        },
        back: function() {
            var oldValue = cal.cache.showInput.innerText;
            cal.cache.showInput.innerHTML = oldValue.length < 2 ? "0" : oldValue.substring(0, oldValue.length - 1);
        },
        /**
         * 校验字符串是否是数字
         * @param str
         * @return 是返回true
         */
        isNumber: function(str) {
            return cal.isInteger(str) || cal.isFloat(str) || cal.isScientific(str);
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
         * 是否是科学计数法
         * @param str
         */
        isScientific: function(str) {
            return str.match(cal.scientificPattern);
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
            cal.isPreInputUnaryOperator = false;
            cal.isPreInputEquals = false;
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
            cal._reset();
        },
        /**
         * 重置各个标志变量以及操作栈
         * @private
         */
        _reset: function() {
            cal.operandStack = [];
            cal.operatorStack = [];
            cal.isPreInputBinaryOperator = false;
            cal.isPreInputUnaryOperator = false;
            cal.isPreInputEquals = false;
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