function setCookie(name,value){ 
	var Days = 365; 
	var exp = new Date(); 
	exp.setTime(exp.getTime() + Days*24*60*60*1000); 
	document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString(); 
}

function getCookie(name){ 
	var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)"); 
	if(arr=document.cookie.match(reg)) return unescape(arr[2]); 
	else return null; 
}

function delCookie(name){ 
	var exp = new Date(); 
	exp.setTime(exp.getTime() - 1); 
	var cval=getCookie(name); 
	if(cval!=null) document.cookie= name + "="+cval+";expires="+exp.toGMTString();
}

/**
* Created by 愚人码头 .
* User: 愚人码头
* Date: 11-5-19
* Time: 上午10:24
*/
//在光标位置插入内容
(function($) {
	$.fn.extend({
		insertContent: function(myValue, t) {
			var $t = $(this)[0];
			if (document.selection) { //ie
				this.focus();
				var sel = document.selection.createRange();
				sel.text = myValue;
				this.focus();
				sel.moveStart("character", -l);
				var wee = sel.text.length;
				if (arguments.length == 2) {
					var l = $t.value.length;
					sel.moveEnd("character", wee + t);
					t <= 0 ? sel.moveStart("character", wee - 2 * t - myValue.length) : sel.moveStart("character", wee - t - myValue.length);

					sel.select();
				}
			} else if ($t.selectionStart || $t.selectionStart == '0') {
				var startPos = $t.selectionStart;
				var endPos = $t.selectionEnd;
				var scrollTop = $t.scrollTop;
				$t.value = $t.value.substring(0, startPos) + myValue + $t.value.substring(endPos, $t.value.length);
				this.focus();
				$t.selectionStart = startPos + myValue.length;
				$t.selectionEnd = startPos + myValue.length;
				$t.scrollTop = scrollTop;
				if (arguments.length == 2) {
					$t.setSelectionRange(startPos - t, $t.selectionEnd + t);
					this.focus();
				}
			} else {
				this.value += myValue;
				this.focus();
			}
		}
	})
})(jQuery);

function strtr(str, from, to) {
  // 来自: http://phpjs.org/functions/strtr/
  // 这个网站有不少很好用的函数，从 php 转来的，路过的程序猿/媛可以去看看~
  var fr = '',
    i = 0,
    j = 0,
    lenStr = 0,
    lenFrom = 0,
    tmpStrictForIn = false,
    fromTypeStr = '',
    toTypeStr = '',
    istr = '';
  var tmpFrom = [];
  var tmpTo = [];
  var ret = '';
  var match = false;

  // Received replace_pairs?
  // Convert to normal from->to chars
  if (typeof from === 'object') {
    /* tmpStrictForIn = this.ini_set('phpjs.strictForIn', false); // Not thread-safe; temporarily set to true
    from = this.krsort(from);
    this.ini_set('phpjs.strictForIn', tmpStrictForIn); */

    for (fr in from) {
      if (from.hasOwnProperty(fr)) {
        tmpFrom.push(fr);
        tmpTo.push(from[fr]);
      }
    }

    from = tmpFrom;
    to = tmpTo;
  }

  // Walk through subject and replace chars when needed
  lenStr = str.length;
  lenFrom = from.length;
  fromTypeStr = typeof from === 'string';
  toTypeStr = typeof to === 'string';

  for (i = 0; i < lenStr; i++) {
    match = false;
    if (fromTypeStr) {
      istr = str.charAt(i);
      for (j = 0; j < lenFrom; j++) {
        if (istr == from.charAt(j)) {
          match = true;
          break;
        }
      }
    } else {
      for (j = 0; j < lenFrom; j++) {
        if (str.substr(i, from[j].length) == from[j]) {
          match = true;
          // Fast forward
          i = (i + from[j].length) - 1;
          break;
        }
      }
    }
    if (match) {
      ret += toTypeStr ? to.charAt(j) : to[j];
    } else {
      ret += str.charAt(i);
    }
  }

  return ret;
}

function pad(target, n) {
    var len = target.toString().length;
    while (len < n) {
        target = '0' + target;
        len++;
    }
    return target;
}

var hexIn = false;
var hexOut = false;
var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64DecodeChars = new Array(
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;
    var charCode;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
    c1 = (hexIn ? str[i++] : str.charCodeAt(i++)) & 0xff;
    if(i == len)
    {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt((c1 & 0x3) << 4);
        out += "==";
        break;
    }
    c2 = (hexIn ? str[i++] : str.charCodeAt(i++));
    if(i == len)
    {
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt((c2 & 0xF) << 2);
        out += "=";
        break;
    }
    c3 = (hexIn ? str[i++] : str.charCodeAt(i++));
    out += base64EncodeChars.charAt(c1 >> 2);
    out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
    out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
    out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;
    var charCode;

    len = str.length;
    i = 0;
    out = hexOut ? [] : "";
    while(i < len) {
    /* c1 */
    do {
        c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
    } while(i < len && c1 == -1);
    if(c1 == -1)
        break;

    /* c2 */
    do {
        c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
    } while(i < len && c2 == -1);
    if(c2 == -1)
        break;

    charCode = (c1 << 2) | ((c2 & 0x30) >> 4);
    hexOut ? out.push(charCode) : out += String.fromCharCode(charCode);

    /* c3 */
    do {
        c3 = str.charCodeAt(i++) & 0xff;
        if(c3 == 61)
        return out;
        c3 = base64DecodeChars[c3];
    } while(i < len && c3 == -1);
    if(c3 == -1)
        break;
    charCode = ((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2);
    hexOut ? out.push(charCode) : out += String.fromCharCode(charCode);

    /* c4 */
    do {
        c4 = str.charCodeAt(i++) & 0xff;
        if(c4 == 61)
        return out;
        c4 = base64DecodeChars[c4];
    } while(i < len && c4 == -1);
    if(c4 == -1)
        break;
    charCode = ((c3 & 0x03) << 6) | c4;
    hexOut ? out.push(charCode) : out += String.fromCharCode(charCode);
    }
    return out;
}

function utf16to8(str) {
    var out, i, len, c;
    var charCode;
    out = hexIn ? [] : "";
    len = str.length;
    for(i = 0; i < len; i++) {
    c = hexIn ? str[i] : str.charCodeAt(i);
	if ((c >= 0x0001) && (c <= 0x007F)) {
        hexIn ? out.push(str[i]) : out += str.charAt(i);
    } else if (c > 0x07FF) {
        charCode = (0xE0 | ((c >> 12) & 0x0F)); hexIn ? out.push(charCode) : out += String.fromCharCode(charCode);
        charCode = (0x80 | ((c >>  6) & 0x3F)); hexIn ? out.push(charCode) : out += String.fromCharCode(charCode);
        charCode = (0x80 | ((c >>  0) & 0x3F)); hexIn ? out.push(charCode) : out += String.fromCharCode(charCode);
    } else {
        charCode = (0xC0 | ((c >>  6) & 0x1F)); hexIn ? out.push(charCode) : out += String.fromCharCode(charCode);
        charCode = (0x80 | ((c >>  0) & 0x3F)); hexIn ? out.push(charCode) : out += String.fromCharCode(charCode);
    }
    }
    return out;
}

function utf8to16(str) {
    var out, i, len, c;
    var char2, char3;
    var charCode;

    out = hexOut ? [] : "";
    len = str.length;
    i = 0;
    while(i < len) {
    c = hexOut ? str[i++] : str.charCodeAt(i++);
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        hexOut ? out.push(str[i-1]) : out += str.charAt(i-1);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = hexOut ? str[i++] : str.charCodeAt(i++);
        charCode = ((c & 0x1F) << 6) | (char2 & 0x3F); hexOut ? out.push(charCode) : out += String.fromCharCode(charCode);
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = hexOut ? str[i++] : str.charCodeAt(i++);
        char3 = hexOut ? str[i++] : str.charCodeAt(i++);
        charCode = ((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0);
        hexOut ? out.push(charCode) : out += String.fromCharCode(charCode);
        break;
    }
    }

    return out;
}

function CharToHex(str) {
    var out, i, len, c, h;
    out = "";
    len = str.length;
    i = 0;
    while(i < len) 
    {
	    c = str.charCodeAt(i++);
	    h = c.toString(16);
	    if(h.length < 2)
	    	h = "0" + h;
	    
	    out += "\\x" + h + " ";
	    if(i > 0 && i % 8 == 0)
	    	out += "\r\n";
    }

    return out;
}

function base64_encode(src, hI) {
	hexIn = hI;
	return base64encode(hexIn ? src : utf16to8(src));
}

function base64_decode(src, hO, out_de) {
	hexOut = hO;
	var ret = base64decode(src);
	if(!hexOut || out_de == 'u' || out_de == 'd'){ ret = utf8to16(ret); }
	return ret;
}

function base64_gb2312(src, op){
	var ret = "";
	$.ajax({
		url: '/ajax/base64_gb2312.php?type=' + op,
		data: {
			data: src
		},
		async: false,
		type: 'POST',
		success: function(e){
			ret = e;
		}
	});
	return ret
}

function base64_encode_gb2312(src){
	return base64_gb2312(src, 'encode')
}

function base64_decode_gb2312(src){
	return base64_gb2312(src, 'decode')
}
