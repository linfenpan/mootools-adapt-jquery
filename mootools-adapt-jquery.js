'use strict';
// 用 mootools 尽量模拟 jQuery
(function(WIN, _$, _$$, NAME) {
  var DOC = window.document;

  function domReady (fn) {
    var done = false, top=true,
      doc = WIN.document, root = DOC.documentElement,
      add = DOC.addEventListener ? 'addEventListener' : 'attachEvent',
      rem = DOC.addEventListener ? 'removeEventListener' : 'detachEvent',
      pre = DOC.addEventListener ? '' : 'on',

      init = function(e) {
        if(e.type == 'readystatechange' && DOC.readyState != 'complete') return;
        (e.type == 'load' ? WIN : DOC)[rem](pre + e.type, init, false);
        if(!done && (done=true)) fn.call(WIN, e.type || e);
      },

      poll = function() {
        try {root.doScroll('left');} catch(e) {setTimeout(poll, 50);return;}
        init('poll');
      };

    if(DOC.readyState == 'complete') {
      fn.call(WIN, 'lazy');
    } else {
      if(DOC.createEventObject && root.doScroll) {
        try {top =! win.frameElement;} catch(e) {}
        if(top) poll();
      }
      DOC[add](pre + 'DOMContentLoaded', init, false);
      DOC[add](pre + 'readystatechange', init, false);
      WIN[add](pre + 'load', init, false);
    }
  }
  function noop() {}
  function toArray(args) {
    return [].slice.call(args, 0);
  }
  function isJQueryInstance(obj) {
    return obj instanceof jQueryAdapter;
  }
  function toCamelCase(str) {
    return str.replace(/[\-_](\w)/g, function(str, key) {
      return key.toUpperCase();
    });
  }

  Function.implement({
    // 是否强制循环
    breakSelf: function() {
      this.$breakSelf = true;
      return this;
    }
  });

  /**
	 * Dummy jQuery factory function
	 *
	 * @param  {element|string|object} expression
	 * @param  {DOMElement} context
	 * @return {DOM Element wrapped in Mootools}
	 */
  var jQuery = function(expression, context) {
    // 处理 jQuery('<html>').
    var element;

    if (typeof expression === 'string' && !context){
      if (expression.charAt(0) === '<' && expression.charAt(expression.length - 1) === '>'){
        expression = new Element('div', {
          html: expression
        }).getChildren();
      }
    }

    if (typeof expression === 'function') {
      return domReady(expression);
    }

    // Handle jQuery(expression) and jQuery(expression, context).
    if (isJQueryInstance(expression)) {
      element = expression;
    } else if (typeof expression === 'object') {
      element = _$$(expression);
    } else {
      context = context || DOC;
      expression = expression.trim();
      element = context.getElements(expression);
    }

    return new jQueryAdapter(element);
  }

  $extend(jQuery, {
    ready: function(fn) {
      fn && domReady(fn);
    },
    noop: noop,
    Deferred: function(fn) {
      var def = new Thenable(fn);
      return $extend(def, {
        done: function(f) { def.then(f, null); return def; },
        fail: function(f) { def.then(null, f); return def; },
        always: function(f) { def.then(f, f); return def; }
      });
    },
    all: Thenable.all,
    race: Thenable.race,
    parseJSON: function(str) {
      return JSON.decode(str);
    },
    param: function() {
      // 仅兼容简单的转换
      return Object.toQueryString.apply(Object, arguments);
    },
    trim: function(str) {
      return (str || '').trim();
    },
    extend: function() {
      var args = toArray(arguments);
      var method = 'append';

      // 深复制
      if (args[0] === true) {
        args.shift();
        args.unshift({});
        method = 'merge'
      }

      return Object[method].apply(Object, args);
    },
    type: function(obj) {
      return typeOf(obj);
    },
    proxy: function(fn, ctx) {
      var args = toArray(arguments).slice(2);
      return function(){
        return fn.apply(ctx, args.concat(toArray(arguments)));
      };
    }
  });

  function jQueryAdapter(elements) {
    if (isJQueryInstance(elements)) {
      return elements;
    }

    var ctx = this;
    elements = elements || [];
    ctx.length = elements.length;

    for (var i = 0; i < ctx.length; i++) {
      ctx[i] = elements[i];
    }
  }
  var _proto_ = jQuery.fn = jQueryAdapter.prototype;

  // 适配 jQuery 的列表
  function adaptList(data) {
    var obj = {};
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        obj[key] = (function(key) {
          return function() {
            var elements = this,
              args = arguments,
              fn = data[key];
            var result = [];

            for (var i = 0, max = this.length; i < max; i++) {
              var elem = elements[i];
              var res = fn.apply(elem, args);
              if (fn.$breakSelf) {
                // combine 仅接收数组
                res && result.combine(res.length ? res : [res]);
              } else if (res != elem) {
                return $type(res).toString().indexOf('element') >= 0 ? jQuery(res) : res;
              }
            }
            return fn.$breakSelf ? jQuery(result) : this;
          };
        })(key);
      }
    }
    return obj;
  }

  // 插入元素
  function grabElements(ctx, content, where) {
    var elems = jQuery(content),
    where = where || 'bottom';
    elems.each(function(elem) {
      ctx.grab(elem, where);
    });
    return ctx;
  }

  var proto = {
    attr: function(name, value) {
      if ($type(name) == 'object') var ret = this.setProperties(name);
      var ret = (!value) ? this.getProperty(name) : this.setProperty(name, value);
      return ret;
    },
    removeAttr: function(name) {
      return this.removeProperty(name);
    },
    html: function(html) {
      if (!$type(html)) return this.get('html');
      this.set('html', html);
      return this;
    },
    text: function(text) {
      if (!text) return this.get('text');
      this.set('text', text);
      return this;
    },
    val: function(value) {
      var ret = (!value) ? this.getProperty("value") : this.setProperty("value", value);
      return ret;
    },
    css: function(name, value) {
      if ($type(name) == 'object') {
        return this.setStyles(name);
      } else {
        if (!value) {
          return this.getStyle(name);
        } else {
          return this.setStyle(name, value);
        }
      }
      return this;
    },

    append: function(content) {
      grabElements(this, content, 'bottom');
      return this;
    },
    prepend: function(content) {
      grabElements(this, content, 'top');
      return this;
    },
    after: function(content) {
      grabElements(this, content, 'after');
      return this;
    },
    before: function(content) {
      grabElements(this, content, 'before');
      return this;
    },

    wrap: function(elems) {
      var $wrap = jQuery(elems);
      var parentNode = this.parentNode;

      $wrap = $wrap.length ? $wrap[0] : $wrap;
      parentNode.replaceChild($wrap, this);
      $wrap.appendChild(this);

      return this;
    },
    unwrap: function() {
      var ctx = this;
      var pt = ctx.getParent(), top = pt.getParent();
      top.replaceChild(ctx, pt);
      pt.destroy();
      return ctx;
    },

    parent: function(expr) {
      return this.getParent(expr);
    }.breakSelf(),
    parents: function(expr) {
      return this.getParents(expr);
    }.breakSelf(),

    remove: function() {
      return this.destroy();
    },

    find: function(expr) {
      return this.getElements(expr);
    }.breakSelf(),
    next: function(expr) {
      return this.getNext(expr);
    }.breakSelf(),
    nextAll: function(expr) {
      return this.getAllNext(expr);
    }.breakSelf(),
    prev: function(expr) {
      return this.getPrevious(expr);
    }.breakSelf(),
    prevAll: function(expr) {
      return this.getAllPrevious(expr);
    }.breakSelf(),
    siblings: function(expr) {
      var $pt = this.getParent();
      return $pt.getChildren(expr).erase(this);
    }.breakSelf(),

    on: function(type, elem, func) {
      var ctx = this;
      if ($type(elem) == 'function') {
        func = elem;
        elem = '';
      } else {
        type += elem ? ':relay('+ elem +')' : '';
      }
      ctx.$fns = ctx.$fns || [];
      func && ctx.$fns.push({ type: type, fn: func });

      return ctx.addEvent(type, func);
    },
    off: function(type, elem, func) {
      var ctx = this;
      if ($type(elem) == 'function') {
        func = elem;
        elem = '';
      } else {
        type += elem ? ':relay('+ elem +')' : '';
      }

      if (func) {
        ctx.removeEvent(type, func);
        var fns = (ctx.$fns || []), newFns = [];
        fns.each(function(item) {
          if (item.type != type || item.fn != func) {
            newFns.push(item);
          }
        });
        ctx.$fns = newFns;
      } else {
        ctx.removeEvents(type);
      }

      if (ctx.$fns.length <= 0) {
        ctx.$fns = void 0;
      }

      return ctx;
    },
    trigger: function(type, elems, args) {
      var ctx = this;
      if ($type(elems) == 'string') {
        type += ':relay('+ elems +')';
      } else {
        args = elems;
      }
      ctx.fireEvent(type, args);
      return ctx;
      // return this.fireEvent(type, args);
    },

    show: function() {
      this.setStyle('display', '');
      return this;
    },
    hide: function() {
      this.setStyle('display', 'none');
      return this;
    },
    toggle: function() {
      var ctx = this;
      ctx.setStyle('display', ctx.getStyle('display') === 'none' ? '' : 'none');
      return ctx;
    },

    is: function(expr) {
      return this.match(expr);
    },
    addClass: function(cls) {
      return this.addClass(cls);
    },
    removeClass: function(cls) {
      return this.removeClass(cls);
    },
    hasClass: function(cls) {
      return this.hasClass(cls);
    },
    toggleClass: function(cls) {
      return this.toggleClass(cls);
    },

    width: function(width) {
      var ctx = this;
      if ($type(width)) {
        return ctx.setStyle('width', width);
      }
      var outerWidth = ctx.getWidth();
      var width = outerWidth - parseInt(ctx.getStyle('padding-left')) - parseInt(ctx.getStyle('padding-right'));
      return width;
    },
    height: function(height) {
      var ctx = this;
      if ($type(height)) {
        return ctx.setStyle('height', height);
      }
      var outerHeight = ctx.getHeight();
      var height = outerHeight - parseInt(ctx.getStyle('padding-top')) - parseInt(ctx.getStyle('padding-bottom'));
      return height;
    },
    outerWidth: function(width) {
      return this.getWidth();
    },
    outerHeight: function(height) {
      return this.getHeight();
    },

    position: function() {
      var offset = this.getOffsets(),
        ptOffset = this.getOffsetParent().getOffsets();
      return { top: offset.y - ptOffset.y, left: offset.x - ptOffset.x };
    },
    offset: function() {
      var offset = this.getOffsets();
      return { top: offset.y, left: offset.x };
    },

    empty: function() {
      return this.set('html', '');
    },

    replaceWith: function(elem) {
      var ctx = this;
      var elems = jQuery(elem), last;
      elems.each(function(el, i) {
        if (!last) {
          ctx.getParent().replaceChild(el, ctx);
        } else {
          proto.after.call(last, el);
        }
        last = el;
      });
      return ctx;
    },

    clone: function(withChildren) {
      var ctx = this, newNode;
      newNode = ctx.cloneNode(withChildren);
      return newNode;
    }.breakSelf(),

    appendTo: function(elem) {
      var ctx = this, result = [];
      var elems = jQuery(elem);

      elems.each(function(el, i) {
        var newNode = proto.clone.call(ctx, true);
        proto.append.call(el, newNode);
        result.push(newNode);
      });
      // 如果先调用删除，在 ie 下，元素的 class 将会丢失
      proto.remove.call(ctx);

      return result;
    }.breakSelf(),

    // uc 的 scrollTop 值，经常是 1.10002, 2.4444 之类的
    scrollTop: function(top) {
      var ctx = this;
      if ($type(top)) {
        ctx.scrollTo(ctx.getScrollLeft(), top);
        return ctx;
      }
      var top = ctx.getScrollTop();
      return top - Math.floor(top) >= .1 ? Math.ceil(top) : Math.floor(top);
    },
    scrollLeft: function(left) {
      var ctx = this;
      if ($type(left)) {
        ctx.scrollTo(left, ctx.getScrollTop());
        return ctx;
      }
      var left = ctx.getScrollLeft();
      return left - Math.floor(left) >= .1 ? Math.ceil(left) : Math.floor(left);
    },

    data: (function() {
      function initDataset(elem) {
        if (!elem.$dataset) {
          elem.$dataset = {};
        }
        return elem.$dataset;
      }

      function datasetCombineWithAttr(elem) {
        var attributes = elem.attributes;
        for (var i = 0, max = attributes.length; i < max; i++) {
          var attr = attributes[i];
          var name = attributes[i].name;
          if (name.indexOf('data-') == 0) {
            var key = toCamelCase(name.split('data-')[1]), value = attr.value;
            elem.$dataset[key] = value;
          }
        }
        return elem.$dataset;
      }

      function queryDataset(elem, key, value) {
        var typeKey = $type(key), typeValue = $type(value);
        var dataset = elem.$dataset = initDataset(elem);

        if (typeKey === 'object') {
          var obj = key;
          Object.keys(obj).each(function(k) {
            dataset[k] = obj[k];
          });
          return elem;
        } else if (typeKey === 'string') {
          if (typeValue) {
            dataset[key] = value;
            return elem;
          }
          return elem.getAttribute('data-' + key) || dataset[key];
        }
        return datasetCombineWithAttr(elem);
      }

      return function(key, value) {
        return queryDataset(this, key, value);
      }
    })()
  };
  $extend(_proto_, adaptList(proto));

  // 动画拓展
  (function() {
    var protoAnimate = {
      animate: function(css, duration, callback, fn) {
        var ctx = this;
        var animations = ctx.$animations = ctx.$animations || new AnimateList(ctx);
        if ($type(css) === 'object') {
          if ($type(duration) === 'function') {
            fn = callback;
            callback = duration;
            duration = null;
          }
          callback = callback || noop;
          duration = duration || 300;

          var animate = new Animate(ctx, {
            duration: duration,
            callback: jQuery.proxy(callback, ctx),
            css: css,
            fn: fn
          });
          animations.push(animate);
        }
        animations.start();

        return ctx;
      },
      delay: function(time) {
        var ctx = this;
        if ($type(time) === 'number') {
          protoAnimate.animate.call(ctx, {}, time);
        }
        return ctx;
      },
      // @param {Boolean} stopAll 是否停止队列的所有动画，否则只停止第一个
      // @param {Boolean} gotoEnd 是否立刻结束当前队列的动画，并且强制进入结束，触发回调
      stop: function(stopAll, gotoEnd) {
        var ctx = this, animations = ctx.$animations;
        animations && animations.stop(stopAll, gotoEnd);
        return ctx;
      }
    };
    $extend(_proto_, adaptList(protoAnimate));

    function AnimateList(elem) {
      var ctx = this;
      ctx.elem = elem;
      ctx.list = [];
      ctx.current = null; // 当前运行动画
      ctx.isRunning = false;
    }
    AnimateList.prototype = {
      push: function(animate) {
        var ctx = this;
        ctx.list.push(animate);
        return ctx;
      },
      next: function() {
        var ctx = this, animate = ctx.list.shift();
        if (animate) {
          ctx.current = animate;
          animate.onEnd = function() {
            ctx.next();
          };
          animate.start();
        } else {
          ctx.current = null;
          ctx.isRunning = false;
        }
      },
      start: function() {
        var ctx = this;
        if (ctx.isRunning) {
          return ctx;
        }
        ctx.isRunning = true;
        ctx.next();
      },
      stop: function(stopAll, gotoEnd) {
        var ctx = this;
        ctx.isRunning = false;

        // 停止当前运行的
        if (ctx.current) {
          ctx.current.onEnd = function() {};
          ctx.current.stop(gotoEnd);
          ctx.current = null;
        }

        // 清空列表
        if (stopAll) {
          ctx.list.each(function(animate) {
            animate.start();
            animate.stop(gotoEnd);
          });
          ctx.list = [];
        } else {
          // 执行下一个动画
          ctx.next();
        }

        return ctx;
      }
    };

    function hexToRgb(str) {
  		var hex = str.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
      if (hex) {
        var colors = hex.slice(1);
    		var rgb = colors.map(function(value){
    			if (value.length == 1) value += value;
    			return value.toInt(16);
    		});
        return rgb;
      }
      return null;
  	}

    var Color = {
  		parse: function(value){
  			if (value.match(/^#[0-9a-f]{3,6}$/i)) return hexToRgb(value);
  			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [+value[1], +value[2], +value[3]] : false;
  		},
  		compute: function(from, to, delta){
  			return from.map(function(value, i){
  				return Math.round(Fx.compute(from[i], to[i], delta));
  			});
  		},
      isColor: function(value) {
        value = value + '';
        return !!(value.match(/^#[0-9a-f]{3,6}$/i) || value.match(/(\d+),\s*(\d+),\s*(\d+)/));
      }
  	};

    // 电脑 CPU 决定，setTimeout() 最快只能是 20ms
    var BaseTime = 20;
    function Animate(elem, options) {
      var ctx = this;
      options = options || {};

      ctx.elem = elem;
      ctx.duration = Math.max(options.duration || 0, BaseTime);
      ctx.callback = options.callback || function() {};
      ctx.css = options.css || {};

      // result 是return的结果
      // currentTime 当前耗费的总时间
      // beginValue 开始的值
      // distanceValue 结束值 - 开始值
      // totalTime 总共的耗时
      ctx.fn = options.fn || function(result, currentTime, beginValue, distanceValue, totalTime) {
        return beginValue + distanceValue * currentTime / totalTime;
      };

      // { width: [5, 'px'] }
      ctx.oldCss = {};
      ctx.isRunning = false;
      ctx.index = 0;
      ctx.count = Math.max(1, ctx.duration / BaseTime);
      ctx.timer = null;
    }

    var ElemProperties = 'scrollTop,scrollLeft'.split(',');

    Animate.prototype = {
      onEnd: function() {},

      set: function(property, now) {
        var elem = this.elem;
        if (ElemProperties.indexOf(property) >= 0) {
          elem[property] = now;
        } else {
          elem.setStyle(property, now);
        }
      },

      step: function() {
        var ctx = this;
        ctx.timer = setTimeout(function() {
          var old = ctx.oldCss, css = ctx.css;
          var elem = ctx.elem, fn = ctx.fn;
          var index = ctx.index++;

          Object.keys(css).each(function(key) {
            var beginValue = old[key][0], endValue = css[key];
            if ($type(beginValue) === 'array') {
              // 颜色，格式为 [244, 244, 244]
              var val = [];
              endValue = Color.parse(endValue);
              beginValue.each(function(_beginValue, i) {
                var _endValue = endValue[i];
                val.push(
                  fn(0, index * BaseTime, _beginValue, _endValue - _beginValue, ctx.duration)
                );
              });
              ctx.set(key, 'rgb(' + val.join(',') + ')');
            } else {
              var val = fn(0, index * BaseTime, beginValue, endValue - beginValue, ctx.duration);
              ctx.set(key, val + (old[key][1] || 0));
            }
          });

          if (index >= ctx.count) {
            ctx._doCallback();
            ctx.isRunning = false;
          } else {
            ctx.step();
          }
        }, BaseTime);
      },

      start: function(css) {
        var ctx = this;

        if (ctx.isRunning) {
          return ctx;
        }
        ctx.isRunning = true;

        ctx.css = css || ctx.css;
        ctx.oldCss = {};
        Object.keys(ctx.css).each(function(key) {
          var styles;
          // TODO 动画更好的方式，应该是建立3个不同的类别，对外提供更好的接口，现在先硬编一下
          if (ElemProperties.indexOf(key) >= 0) {
            ctx.oldCss[key] = [ctx.elem[key]];
          } else {
            var value = ctx.elem.getStyle(key);
            if (Color.isColor(value)) {
              ctx.oldCss[key] = [Color.parse(value)];
            } else {
              styles = value.match(/(-?\d*\.?\d*)(.*)/);
              // 5px -> ["5px", "5", "px"]
              ctx.oldCss[key] = [+styles[1], styles[2]];
            }
          }
        });

        ctx.index = 1;
        ctx.step();

        return ctx;
      },

      // 获取动画之前的样式
      getOrignalCss: function() {
        var ctx = this;
        var oldCss = {};
        Object.keys(ctx.oldCss).each(function(key) {
          oldCss[key] = ctx.oldCss[key].join('');
        });
        return oldCss;
      },

      reset: function(css) {
        var ctx = this.stop();
        if (!css) {
          css = ctx.getOrignalCss();
        }

        Object.keys(css).each(function(key) {
          ctx.set(key, css[key]);
        });

        return ctx;
      },

      stop: function(gotoEnd) {
        var ctx = this;
        var isRunning = ctx.isRunning;

        clearTimeout(ctx.timer);
        ctx.isRunning = false;

        if (isRunning) {
          if (gotoEnd) {
            ctx.reset(ctx.css);
          }
          ctx._doCallback();
        }
        return ctx;
      },

      _doCallback: function() {
        var ctx = this;
        ctx.callback();
        ctx.onEnd();
      }
    };
  })();


  // 方法注入
  var protoEvent = {};
  ["blur","focus","load","resize","scroll","unload","click","dblclick","mousedown","mouseup","mousemove","mouseover","mouseout","mouseenter","mouseleave","change","select","submit","keydown","keypress","keyup","error"].each(function(key) {
    protoEvent[key] = function(fn) {
      var ctx = this;
      if ($type(fn) == 'function') {
        return ctx.addEvent(key, fn);
      }
      ctx[key] ? ctx[key]() : ctx.fireEvent(key);
      return ctx;
    }
  });
  $extend(_proto_, adaptList(protoEvent));

  // 拓展列表的方法
  $extend(_proto_, {
    each: function(fn) {
      for (var i = 0; i < this.length; i++) {
        var elem = this[i];
        fn.call(this, elem, i);
      }
      return this;
    },
    eq: function(index) {
      var list = this,
        length = this.length;
      index = index % length;
      if (index < 0) {
        index += length;
      } else if (index >= length) {
        index -= length;
      }
      return jQuery(list[index]);
    },
    last: function() {
      return this.eq(-1);
    },
    first: function() {
      return this.eq(0);
    },
    index: function(elem) {
      if ($type(elem)) {
        return toArray(this).indexOf(isJQueryInstance(elem) ? elem[0] : elem );
      }
      var ctx = jQuery(this[0]);
      return toArray(ctx.parent().children()).indexOf(this[0]);
    },
    children: function(expr) {
      var result = [];
      this.each(function(elem) {
        result.combine(elem.getChildren(expr) || []);
      });
      return jQuery(result);
    },
    filter: function(expr) {
      var result = [];
      this.each(function(elem) {
        if (elem.match(expr)) {
          result.push(elem);
        }
      });
      return jQuery(result);
    },
    map: function(fn) {
      var result = [];
      this.each(function(elem, index) {
        result.push(fn.call(elem, elem, index));
      });
      return result;
    },
    toArray: function() {
      return toArray(this);
    }
  });

  // ajax 部分
  ;(function() {
    var jsonpId = 1, jsonpKey = 'mquery_jsonp_';
    function jsonp(params) {
      var url = params.url, fnSuccess = params.success, fnError = params.error, fnComplete = params.complete;
      var callback = jsonpKey + jsonpId++;
      var isFinish = false;

      var script = new Element('script', {
  			type: 'text/javascript',
  			async: true,
  			src: url.replace(/(\w+=)(\?)(&|$)/, '$1' + callback + '$3') + '&' + jQuery.param(params.data)
  		});

      function remove() {
        if (script) {
          script.destroy();
          script = null;
        }
      }

      function cancel() {
        remove();
        if (!isFinish) {
          isFinish = true;
          fnError.call(ctx);
          fnComplete.call(ctx);
        }
      }

      var ctx = { cancel: cancel };

      window[callback] = function() {
        remove();
        isFinish = true;
        fnSuccess.apply(ctx, arguments);
        fnComplete.apply(ctx, arguments);
      };

      script.inject(document.head || jQuery('head')[0]);

      return ctx;
    }

    function ajax(url, settings) {
      var deferred = jQuery.Deferred();
      var xhr;

      if ($type(url) === 'object') {
        settings = url;
        url = null;
      }
      settings = $extend({
        url: url || '',
        beforeSend: noop,
        success: noop,
        error: noop,
        complete: noop,

        async: true,
        type: 'get',
        cache: true,
        headers: {
    			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    		},
        data: {},
        crossDomain: null,
        timeout: 0,
        dataFilter: function(data, dataType) {
          if (dataType === 'json') {
            try {
              data = JSON.decode(data);
            } catch (e) {
              settings.error(e);
            }
          }
          return data;
        },
        dataType: 'text'
      }, settings || {});

      // 超时处理
      var timer, isTimeout = false;
      var timeout = settings.timeout;
      if (timeout) {
        timer = setTimeout(function() {
          isTimeout = true;
          xhr.abort();
        }, timeout);
      }

      // 绑定 deferred，错误超时等
      var fnSuccess = settings.success;
      settings.success = function(data) {
        clearTimeout(timer);
        data = settings.dataFilter(data, settings.dataType);
        deferred.resolve(data);
        fnSuccess.call(null, data);
      };
      var fnError = settings.error;
      settings.error = function(data) {
        clearTimeout(timer);
        deferred.reject(isTimeout ? xhr : data);
        var params = [data, xhr];
        if (isTimeout) {
          xhr.isTimeout = isTimeout;
          params = [xhr];
        }
        fnError.apply(null, params);
      };

      if (/\w+=\?(&|$)/.test(settings.url)) {
        // 走 jsonp
        xhr = jsonp(settings);
      } else {
        // 走 XMLHttpRequest
        // 检查是否跨域
        var originAnchor = document.createElement( "a" );
        originAnchor.href = location.href;
        if (settings.crossDomain == null) {
          var urlAnchor = document.createElement( "a" );
          // Support: IE <=8 - 11, Edge 12 - 13
          // IE throws exception on accessing the href property if url is malformed,
          // e.g. http://example.com:80x/
          try {
            urlAnchor.href = s.url;
            // Support: IE <=8 - 11 only
            // Anchor's host property isn't correctly set when s.url is relative
            urlAnchor.href = urlAnchor.href;
            settings.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
              urlAnchor.protocol + "//" + urlAnchor.host;
          } catch ( e ) {
            // If there is an error parsing the URL, assume it is crossDomain,
            // it can be rejected by the transport if it is invalid
            settings.crossDomain = true;
          }
        }
        if (!settings.crossDomain && !settings.headers['X-Requested-With']) {
          settings.headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        // 适配 mootools Request 的参数
        var params = $extend({}, Request.prototype.options);
        $extend(params, (function() {
          var result = {};
          var map = {
            url: 'url',
            data: 'data',
            beforeSend: 'onRequest',
            success: 'onSuccess',
            error: 'onFailure,onCancel,onTimeout',
            complete: 'onComplete',
            type: 'method',
            cache: 'noCache'
          };
          Object.keys(map).each(function(key) {
            var str = map[key];
            str.split(',').each(function(k) {
              result[k] = settings[key];
            });
          });

          return result;
        })());
        xhr = new Request(params);
        xhr.headers = settings.headers;
        xhr.send();
      }

      return $extend(xhr, {
        abort: function() { return xhr.cancel(); },
        always: jQuery.proxy(deferred.always, deferred),
        done: jQuery.proxy(deferred.done, deferred),
        fail: jQuery.proxy(deferred.fail, deferred),
        state: function() { return deferred.state; }
      });
    }

    var ajaxProto = {
      ajax: ajax,
      get: function(url, data, callback, dataType) {
        if (typeof callback === 'string') {
          dataType = callback;
          callback = null;
        }
        return ajaxProto.ajax(url, { method: 'GET', data: data || {}, success: callback || noop, dataType: dataType || 'text' });
      },
      post: function(url, data, callback, dataType) {
        if (typeof callback === 'string') {
          dataType = callback;
          callback = null;
        }
        return ajaxProto.ajax(url, { method: 'POST', data: data || {}, success: callback || noop, dataType: dataType || 'text' });
      },
      getJSON: function(url, data, callback) {
        return ajaxProto.ajax(url, { method: 'GET', data: data || {}, success: callback || noop, dataType: 'json' });
      }
    };

    $extend(jQuery, ajaxProto);
  })();

  WIN[NAME] = jQuery;
})(window, $, $$, window.JQUERY_NAME || 'jQuery');
