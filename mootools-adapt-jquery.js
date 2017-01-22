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
    },
    // TODO AJAX 部分
    ajax: function() {},
    get: function() {},
    post: function() {},
    getJSON: function() {}
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
      $wrap.append(this);

      return this;
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
      return this.getChildren(expr);
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

    appendTo: function(elem) {
      var ctx = this, result = [];
      var elems = jQuery(elem);

      ctx.remove();
      elems.each(function(el, i) {
        var newNode = ctx.cloneNode(true);
        proto.append.call(el, newNode);
        result.push(newNode);
      });

      return result;
    }.breakSelf(),

    scrollTop: function(top) {
      var ctx = this;
      if ($type(top)) {
        ctx.scrollTo(ctx.getScrollLeft(), top);
        return ctx;
      }
      return ctx.getScrollTop();
    },
    scrollLeft: function(left) {
      var ctx = this;
      if ($type(left)) {
        ctx.scrollTo(left, ctx.getScrollTop());
        return ctx;
      }
      return ctx.getScrollLeft();
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
    })(),

    animate: function() {

      return this;
    },
    // @param {Boolean} stopAll 是否停止队列的所有动画，否则只停止第一个
    // @param {Boolean} gotoEnd 是否立刻结束当前队列的动画，并且强制进入结束，触发回调
    stop: function(stopAll, gotoEnd) {

      return this;
    }
  };
  $extend(_proto_, adaptList(proto));

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
    // TODO 其他方法
    filter: function(fn) {
      var result = [];
      this.each(function(elem, index) {
        if (fn.call(elem, index)) {
          result.push(elem);
        }
      });
      return jQuery(result);
    },
    map: function(fn) {
      var result = [];
      this.each(function(elem, index) {
        result.push(fn.call(elem, index));
      });
      return jQuery(result);
    },
    toArray: function() {
      return toArray(this);
    }
  });

  WIN[NAME] = jQuery;
})(window, $, $$, window.JQUERY_NAME || 'jQuery');
