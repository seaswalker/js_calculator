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
			showInput: document.getElementById("show-input"),
			//上一步计算结果显示区域
			preStep: document.getElementById("pre-step"),
			//二元运算符
			binaryOperator: null
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
				var oldValue = cal.showInput.innerText;
				if (oldValue.length < 2) {
					var newValue = "";
					newValue = "0";
				} else {
					newValue = oldValue.substring(0, oldValue.length - 1);
				}
				cal.showInput.innerHTML = oldValue.length < 2 ? "0" : ;
			});
		},
		//工具方法，为element添加事件处理函数
		//element，需要添加事件的dom元素，name事件名称(不含on)，handler事件处理函数
		addEvent: function(element, name, handler) {
			if (window.addEventListener) {
				window.addEventListener(name, handler, true);
			} else if (window.attachEvent) {
				window.attachEvent("on" + name, handler);
			}
		}
	};
	return cal;
})();