/***
 * jquery local chat
 * @version v2.0 
 * @createDate -- 2012-5-28
 * @author hoojo
 * @email hoojo_@126.com
 * @blog http://hoojo.cnblogs.com & http://blog.csdn.net/IBM_hoojo
 * @requires jQuery v1.2.3 or later, send.message.editor-1.0.js
 * Copyright (c) 2012 M. hoo
 **/
 
;(function ($) {
 
    if (/1\.(0|1|2)\.(0|1|2)/.test($.fn.jquery) || /^1.1/.test($.fn.jquery)) {
        alert('WebIM requires jQuery v1.2.3 or later!  You are using v' + $.fn.jquery);
        return;
    }
    
    var faceTimed, count = 0;
    
    var _opts = defaultOptions = {
        version: 2.0,
        chat: "#chat",
        chatEl: function () {
            var $chat = _opts.chat;
            if ((typeof _opts.chat) == "string") {
                $chat = $(_opts.chat);
            } else if ((typeof _opts.chat) == "object") {
                if (!$chat.get(0)) {
                    $chat = $($chat);
                }
            } 
            return $chat;
        },
        sendMessageIFrame: function (receiverId) {
            return $("iframe[name='sendMessage" + receiverId + "']").get(0).contentWindow;
        },
        receiveMessageDoc: function (receiverId) {
            receiverId = receiverId || "";
            var docs = [];
            $.each($("iframe[name^='receiveMessage" + receiverId + "']"), function () {
                docs.push($(this.contentWindow.document));
            });
          
            return docs;
            //return $($("iframe[name^='receiveMessage" + receiverId + "']").get(0).contentWindow.document);
        },
        sender: "", // 发送者
        receiver: "", // 接收者      
		productInfo: "",//产品信息
		topical :"topical",//会话主题
		receiveList:[],//会话信息接收人组
		logoImg:"",//logo Image
		phoneNumber:"",//坐席手机
		tellNumber :"",//公司电话
		companyName:"",//公司名称
        setTitle: function (chatEl) {
            var receiver = this.getReceiver(chatEl);
            chatEl.find(".title").html("和" + receiver + "聊天对话中");
        },
        getReceiver: function (chatEl) {
            var receiver = chatEl.attr("receiver");
            if (~receiver.indexOf("@")) {
                receiver = receiver.split("@")[0];
            }
            return receiver;
        },
        
        // 接收消息iframe样式
        receiveStyle: [
            '<html>',
                '<head><style type="text/css">',
                'body{border:0;margin:0;padding:3px;height:98%;cursor:text;background-color:white;font-size:12px;font-family:Courier,serif,monospace;}',
                '.msg{margin-left: 1em;}p{margin:0;padding:0;}.me{color: blue; font-size:14px; }.you{color:green; font-size:14px;}',
                '</style></head>',
                '<body></body>',
            '</html>'
        ].join(""),
        writeReceiveStyle: function (receiverId) {
            this.receiveMessageDoc(receiverId)[0].get(0).write(this.receiveStyle);
        },
        
        datetimeFormat: function (v) {
            if (~~v < 10) {
                return "0" + v;
            }
            return v;
        },
        getDatetime: function () {
            // 设置当前发送日前
            var date = new Date();
            var datetime = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
            datetime = " " + _opts.datetimeFormat(date.getHours()) 
                        + ":" + _opts.datetimeFormat(date.getMinutes()) 
                        + ":" + _opts.datetimeFormat(date.getSeconds());
            return datetime;
        },
        
        /***
         * 发送消息的格式模板                    
         * flag = true 表示当前user是自己，否则就是对方
         **/ 
        receiveMessageTpl: function (userName, styleTpl, content, flag) {
            var userCls = flag ? "me" : "you";
            if (styleTpl && flag) {
                content = [ "<span style='", styleTpl, "'>", content, "</span>" ].join("");
            }
            return [
                '<p class="', userCls, '">', _opts.getDatetime(), '  ', userName, ':</p>',
                '<p class="msg">', content, '</p>'
            ].join("");
        },
        formatHtml2 : function(content){
        	
        	var emojiList = content.match(new RegExp("\\[@\\d+\\]","gmi"));
			for(var i in emojiList){
				var imgId = emojiList[i].match(new RegExp("\\d+"));
				
				if(imgId != null){
					imgUrl = ["<img src='",_opts.faceImagePath,imgId[0],".png","'/>"].join("");

					content = content.replace(emojiList[i], imgUrl);
				}
			}  
			
			return content;
        },
        formatHtml : function(content){
			var html = content;
			html = html.replace(new RegExp("<br>", "gm"), "");
			html = html.replace(new RegExp("<div></div>", "gm"), "");
			html = html.replace(new RegExp("<P>", "gm"), "");
			html = html.replace(new RegExp("</P>", "gm"), "");
			html = html.replace(new RegExp("&nbsp;", "gm"), "");

			html = html.replace(new RegExp("<div>", "gm"), "\n");//换行
			html = html.replace(new RegExp("</div>", "gm"), "");
			
			var tmpStr = window.location.href.replace(window.location.search,"");
			var arrTmp = tmpStr.split("/");
			arrTmp.pop();
			tmpStr = arrTmp.join("/");
			
			//表情控制转码
			var emojiList = html.match(new RegExp("<img .+?>","gmi"));
			for(var i in emojiList){
				var imgHtml = emojiList[i];
				
				var imgId = imgHtml.match(new RegExp("face\\d+\\.png","gi"));
				if(imgId != null){
					var str = imgId[0];
					var idList = str.match(new RegExp("\\d+","gi"));
					if(idList != null){
						html = html.replace(imgHtml,"[@" + idList[0] + "]");
					}
				}
			}
			return "{" + _opts.topical + "}" + html;
		},        
        // 工具类按钮触发事件返回html模板
        sendMessageStyle: {
             cssStyle: {
                 bold: "font-weight: bold;",
                 underline: "text-decoration: underline;",
                 italic: "font-style: oblique;"
             },
             setStyle: function (style, val) {
                 if (val) {
                     _opts.sendMessageStyle[style] = val;
                 } else {
                     var styleVal = _opts.sendMessageStyle[style];
                     if (styleVal === undefined || !styleVal) {
                         _opts.sendMessageStyle[style] = true;
                     } else {
                         _opts.sendMessageStyle[style] = false;
                     }
                 }
             },
             getStyleTpl: function () {
                 var tpl = "";
                 $.each(_opts.sendMessageStyle, function (style, item) {
                     //alert(style + "#" + item + "#" + (typeof item));
                     if (item === true) {
                         tpl += _opts.sendMessageStyle.cssStyle[style];
                     } else if ((typeof item) === "string") {
                         //alert(style + "-------------" + sendMessageStyle[style]);
                         tpl += style + ":" + item + ";";
                     }
                 });
                 return tpl;
             }
        },
        // 向接收消息iframe区域写消息 写消息mrtom
        writeReceiveMessage: function (receiverId, userName, content, flag) {
            if (content) {          
                
             	content = _opts.formatHtml2(content);
             	
             	content = content.replace('{'+_opts.topical+'}','');
            	
                // 发送消息的样式
                var styleTpl = _opts.sendMessageStyle.getStyleTpl();
                var receiveMessageDoc = _opts.receiveMessageDoc(receiverId);
              
                $.each(receiveMessageDoc, function () {
                    var $body = this.find("body");
                    // 向接收信息区域写入发送的数据
                    $body.append(_opts.receiveMessageTpl(userName, styleTpl, content, flag));
                    // 滚动条滚到底部
                    this.scrollTop(this.height());
                });
            }
        },
        //mrtom SendIqMessage
        sendIQHandler: function ($chatMain) {
            var doc = $chatMain.find("iframe[name^='sendMessage']").get(0).contentWindow.document;
            var content = doc.body.innerHTML;    
            
            if (content) {
                var sender = $chatMain.attr("sender");
                var receiverId = $chatMain.attr("id");
                                
                remote.jsjac.chat.sendIQMessage("d",sender);                
            }
          }
        ,
        // 发送消息  获取消息框mrtom
        sendHandler: function ($chatMain) {
            var doc = $chatMain.find("iframe[name^='sendMessage']").get(0).contentWindow.document;
            
            var content = doc.body.innerHTML;            
           
            // 获取即将发送的内容
            if (content) {
                var sender = $chatMain.attr("sender");
                var receiverId = $chatMain.attr("id");
               
                // 接收区域写消息
                _opts.writeReceiveMessage(receiverId, sender, content, true);
                
                //############# XXX
                var receiver = $chatMain.find("#to").val();
                
                //var receiver = $chatMain.attr("receiver");
                // 判断是否是手机端会话，如果是就发送纯text，否则就发送html代码
                /*var flag = _opts.isMobileClient(receiver);
                if (flag) {
                    var text = $(doc.body).text();
                    text = $.trim(text);
                    if (text) {
                    	
                    	//格式化
                    	text = _opts.formatHtml(text);
                    	
                    	//alert(text);
                    	
                        // 远程发送消息
                        remote.jsjac.chat.sendMessage(text, receiver);
                    }
                } else { // 非手机端通信 可以发送html代码
                    var styleTpl = _opts.sendMessageStyle.getStyleTpl();
                    //content = [ "<span style='", styleTpl, "'>", content, "</span>" ].join("");
                    
                    //格式化
                    //content = _opts.formatHtml(content);
                    
                    alert(content);
                    
                    remote.jsjac.chat.sendMessage(content, receiver);
                }*/
                
                //格式化
                content = _opts.formatHtml(content);       
                remote.jsjac.chat.sendMessage(content, receiver);
                
                // 清空发送区域
                $(doc).find("body").html("");
            }
        }, 
        
        faceImagePath: "images/emoj/face",
        faceElTpl: function (i) {
            return ["<img src='",this.faceImagePath,(i -1),".png","'/>"].join("");
        },
        // 创建表情html elements
        createFaceElement: function ($chat) {
            var faces = [];
            for (var i = 1; i < 100; i++) {
                 faces.push(this.faceElTpl(i));
                 if (i % 11 == 0) {
                     faces.push("<br/>");
                 } 
            }
            $chat.find("#face").html(faces.join(""));
            this.faceHandler($chat);
        },
        // 插入表情
        faceHandler: function ($chat) {
            $chat.find("#face img").click(function () {
                 $chat.find("#face").hide(150);
                 //var imgEL = "<img src='" + $(this).attr("gif") + "'/>";
                 var imgEL = '<img src="' + $(this).attr("src") + '"/>';
                 
                 var $chatMain = $(this).parents(".chat-main");
                 var win = $chatMain.find("iframe[name^='sendMessage']").get(0).contentWindow;
                 var doc = win.document;
                 sendMessageEditor.insertAtCursor(imgEL, doc, win);
            });
            // 表情隐藏
            $chat.find("#face, #face img").mouseover(function () {
                window.clearTimeout(faceTimed);
            }).mouseout(function () {
                window.clearTimeout(faceTimed);
                faceTimed = window.setTimeout(function () {
                    $chat.find("#face").hide(150);
                }, 700);
            });
        },
        /***
         * 发送消息工具栏按钮事件方法 mrtom tool click
         **/
        toolBarHandler: function () {
            var $chat = $(this).parents(".chat-main");
            var targetCls = $(this).attr("class");
                    
            if (targetCls == "face") {
                $chat.find("#face").show(150);
                window.clearTimeout(faceTimed);
                faceTimed = window.setTimeout(function () {
                    $chat.find("#face").hide(150);
                }, 1000);
            } else if (this.tagName == "DIV") {
                _opts.sendMessageStyle.setStyle(targetCls);
            } else if (this.tagName == "SELECT") {
                _opts.sendMessageStyle.setStyle($(this).attr("name"), $(this).val());
                if ($(this).attr("name") == "color") {
                    $(this).css("background-color", $(this).val());
                }
            }
            
            // 设置sendMessage iframe的style css
            _opts.writeSendStyle();
        },
        // 设置sendMessage iframe的style css
        writeSendStyle: function () {
            var styleTpl = _opts.sendMessageStyle.getStyleTpl();
            var styleEL = ['<style type="text/css">body{', styleTpl,'}</style>'].join("");
            
            $("body").find("iframe[name^='sendMessage']").each(function () {
                var $head = $(this.contentWindow.document).find("head");
                if ($head.find("style").size() > 1) {
                    $head.find("style:gt(0)").remove();
                }
                if (styleTpl) {
                    $head.append(styleEL);
                }
            });
        },                
        
        isMobileClient: function (receiver) {
            var moblieClients = ["iphone", "ipad", "ipod", "wp7", "android", "blackberry", "spark", "warning", "symbian"];
            var flag = false;
            for (var i in moblieClients) {
                if (~receiver.toLowerCase().indexOf(moblieClients[i])) {
                    return true;
                }
            }
            return false;
        },
 
        // 聊天界面html元素
        chatLayoutTemplate: function (userJID, sender, receiver, product, flag) {
            var display = "";
            if (flag) {
                display = "style='display: none;'";
            }
            return [
            '<div class="chat-main" id="', userJID,
                '" sender="', sender, '" receiver="', receiver, '">',
                    
                '<div id="chat"><div class="radius">',
                    '<table>',
                        '<tr>',
                            '<td colspan="3" class="title"></td>',
                        '</tr>',
                        '<tr>',
                            '<td class="receive-message">',
                                '<iframe name="receiveMessage', userJID,'" frameborder="0" width="100%" height="100%"></iframe>',
                            '</td>',
                            '<td rowspan="4" class="split" ', display, '></td>',
                            '<td rowspan="4" class="product-info" ', display, '>',
                                '<ul>',
                                    '<div class="header">EverySale Chat</div>',
                                    '<li class="pic">',
                                    '<img src="', product.pic, '"/></li>',
                                    '<li class="product-name"></li>',
                                    '<li class="price">姓名：<input type=text size=10/></li>',
                                    '<li class="market-price">电话：<input size=10/></li>',
                                    '<li>Q&nbsp;&nbsp;Q：<input size=10/></li>',
                                    '<li>邮箱：<input size=10/></li>',
                                    '<li>&nbsp;</li><li><button>保存客户</button></li>',
                                    '<li><button>快捷回复</button></li>',
                                    '<li><button>历史记录</button></li>',
                                '</ul>',
                            '</td>',
                        '</tr>',
                        '<tr class="tool-bar">',
                            '<td>',
                                '<select name="font-family" class="family">',
                                    '<option>宋体</option>',
                                    '<option>黑体</option>',
                                    '<option>幼圆</option>',
                                    '<option>华文行楷</option>',
                                    '<option>华文楷体</option>',
                                    '<option>华文楷体</option>',
                                    '<option>华文彩云</option>',
                                    '<option>华文隶书</option>',
                                    '<option>微软雅黑</option>',
                                    '<option>Fixedsys</option>',
                                '</select>',                                
                                '<select name="font-size">',
                                    '<option value="12px">大小</option>',
                                    '<option value="10px">10</option>',
                                    '<option value="12px">12</option>',
                                    '<option value="14px">14</option>',
                                    '<option value="16px">16</option>',
                                    '<option value="18px">18</option>',
                                    '<option value="20px">20</option>',
                                    '<option value="24px">24</option>',
                                    '<option value="28px">28</option>',
                                    '<option value="36px">36</option>',
                                    '<option value="42px">42</option>',
                                    '<option value="52px">52</option>',
                                '</select>',
                                '<select name="color">',
                                    '<option value="" selected="selected">颜色</option>',
                                    '<option value="#000000" style="background-color:#000000"></option>',
                                    '<option value="#FFFFFF" style="background-color:#FFFFFF"></option>',
                                    '<option value="#008000" style="background-color:#008000"></option>',
                                    '<option value="#800000" style="background-color:#800000"></option>',
                                    '<option value="#808000" style="background-color:#808000"></option>',
                                    '<option value="#000080" style="background-color:#000080"></option>',
                                    '<option value="#800080" style="background-color:#800080"></option>',
                                    '<option value="#808080" style="background-color:#808080"></option>',
                                    '<option value="#FFFF00" style="background-color:#FFFF00"></option>',
                                    '<option value="#00FF00" style="background-color:#00FF00"></option>',
                                    '<option value="#00FFFF" style="background-color:#00FFFF"></option>',
                                    '<option value="#FF00FF" style="background-color:#FF00FF"></option>',
                                    '<option value="#FF0000" style="background-color:#FF0000"></option>',
                                    '<option value="#0000FF" style="background-color:#0000FF"></option>',
                                    '<option value="#008080" style="background-color:#008080"></option>',
                                '</select>',
                                '<div class="bold"></div>',
                                '<div class="underline"></div>',
                                '<div class="italic"></div>',
                                '<div class="face"></div>',
                                '<div class="history">消息记录</div>',
                            '</td>',
                        '</tr>',
                        '<tr class="send-message">',
                            '<td>',
                                '<iframe name="sendMessage', userJID,'" width="100%" height="80px" frameborder="0"></iframe>',
                            '</td>',
                        '</tr>',
                        '<tr class="bottom-bar">',
                            '<td><input type="text" id="to" name="to" value="hoojo" style="width: 100px; display: none;"/><input type="button" value="IQ Request" id="sendIQ"/><input type="button" value="关闭" id="close"/>',
                            '<input type="button" value="发送(Enter)" id="send"/> </td>',
                        '</tr>',
                    '</table></div>',
                    '<div id="face"></div>',
                '</div>',
            '</div>'
            ].join("");
        },
        
        initWebIM: function (userJID, receiver) {
            var product = {
                name: _opts.receiver,
                pic: "images/app_logo.png",
                price: "",
                marketPrice: "",
                deliverOrgs: "",
                wareHouses: "",
                skuAttrs: ""
            };
            var chatEl = $(_opts.chatLayoutTemplate(userJID, _opts.sender, receiver, product));
            
            $("body").append(chatEl);                        
                                
            // 拖拽
            $("#" + userJID).easydrag();
                   
            // 初始化sendMessageEditor相关信息
            sendMessageEditor.iframe = this.sendMessageIFrame(userJID);
            sendMessageEditor.init(userJID);    
            
            _opts.setTitle(chatEl);
            _opts.writeReceiveStyle(userJID);
            _opts.writeSendStyle();
            _opts.createFaceElement(chatEl);
            
            // 查看更多详情
            chatEl.find(".more").click(function () {
                var $ul = $(this).parents("ul");
                $ul.find(".more").toggle();
                $ul.find(".info").toggle();
                $ul.find(".pic").toggle();
            });
            
            // 收缩详情
            chatEl.find(".split").toggle(function () {
                $(".product-info").hide();
                $(this).parents(".radius").css("border-right-width", "0");
            }, function () {
                $(".product-info").show();
                $(this).parents(".radius").css("border-right-width", "8px");
            });
            
            // 工具类绑定事件 settings.toolBarHandler
            chatEl.find(".tool-bar td").children().click(this.toolBarHandler);
             chatEl.find("#send").click(function () {
                 var $chatMain = $(this).parents(".chat-main");
                _opts.sendHandler($chatMain);
             });
             chatEl.find("#close").click(function () {
                 var $chatMain = $(this).parents(".chat-main");
                $chatMain.hide(500);
             });
             
             chatEl.find("#sendIQ").click(function () {
                 var $chatMain = $(this).parents(".chat-main");
                 _opts.sendIQHandler($chatMain);
             });             
             
             // 首先取消事件绑定，当一次性发多条消息的情况下会同时绑定多个相同事件
            $(".have-msg, .no-msg, .chat-main").unbind("click");
             $(".have-msg").bind("click", function () {
                $(this).hide();
                $(".no-msg").show();
                $(".chat-main:hidden").show(150);
            });
            
            $(".no-msg").click(function () {
                $(".chat-main:hidden").each(function (i, item) {
                    var top = i * 10 + 50;
                    var left = i * 20 + 50;
                    $(this).show(500).css({top: top, left: left});
                });
            });
            
            $(".chat-main").click(function () {
                $(".chat-main").css("z-index", 9999);
                $(this).css({"z-index": 10000});
            });
             
             $(this.sendMessageIFrame(userJID).document).keyup(function (event) {
                 var e = event || window.event;
                 var keyCode = e.which || e.keyCode;
                 if (keyCode == 13) {
                     var $chatMain = $("#" + $(this).find("body").attr("jid"));
                     _opts.sendHandler($chatMain);
                 }
             });
        },
        
        // 建立新聊天窗口
        newWebIM: function (settings) {
            var chatUser = remote.userAddress(settings.receiver);
            var userJID = "u" + hex_md5(chatUser);
            _opts.initWebIM(userJID, chatUser);
            
            $("#" + userJID).find(remote.receiver).val(chatUser);
            $("#" + userJID).show(220);
        },
        
        // 2远程发送消息时执行函数 mrtom
        messageHandler: function (user, content) {
            var userName = user.split("@")[0];
            var tempUser = user;
            if (~tempUser.indexOf("/")) {
                tempUser = tempUser.substr(0, tempUser.indexOf("/"));
            }
            var userJID = "u" + hex_md5(tempUser);
            
            // 首次初始webIM
            if (!$("#" + userJID).get(0)) {
                // 初始IM面板；
                _opts.initWebIM(userJID, user);
            } 
            // 设置消息接受者的名称
            $("#" + userJID).find(remote.receiver).val(user);
            
            if ($("#" + userJID).get(0)) {
                // 消息提示
                if ($("div[id='" + userJID + "']:hidden").get(0)) {
                    var haveMessage = $(".have-msg");
                    haveMessage.show();
                    $(".no-msg").hide();
                }
                
                _opts.messageTip("闪聊有了新消息，请查收！");
                // 向chat接收信息区域写消息
                remote.jsjac.chat.writeMessage(userJID, userName, content);
            } 
        },
        
        // 消息提示
        messageTip: function () {
            if (count % 2 == 0) {
                window.focus();
                document.title = "你来了新消息，请查收！";
            } else {
                document.title = "";                
            }
            if (count > 4) {
                document.title = "";    
                count = 0;            
            } else {
                window.setTimeout(_opts.messageTip, 1000);
                count ++;
            }
        }
    };
    
    // 初始化远程聊天程序相关方法
    var initRemoteIM = function (settings) {
        
        // 初始化远程消息
        remote.jsjac.chat.init();
        
        // 设置客户端写入信息方法
        remote.jsjac.chat.writeReceiveMessage = settings.writeReceiveMessage;
        
        // 注册事件
        $(window).bind({
             unload: remote.jsjac.chat.unloadHandler,
             error: remote.jsjac.chat.errorHandler,
             beforeunload: remote.jsjac.chat.logout
        });
    }
    
    $.extend({
        WebIM: function (opts) {
            opts = opts || {};
            // 覆盖默认配置
            defaultOptions = $.extend(defaultOptions, defaultOptions, opts);
            var settings = $.extend({}, defaultOptions, opts);    
            initRemoteIM(settings);
            
            settings.newWebIM(settings);
            
            $.WebIM.settings = settings;
        }
    });
    
    $.WebIM.settings = $.WebIM.settings || _opts;
    $.WebIM.initWebIM = _opts.initWebIM;
    $.WebIM.newWebIM = _opts.newWebIM;
    $.WebIM.messageHandler = _opts.messageHandler;
    
})(jQuery);
