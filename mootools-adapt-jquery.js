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
        }).getFirst();
      }
    }

    if (typeof expression === 'function') {
      return domReady(expression);
    }

    // Handle jQuery(expression) and jQuery(expression, context).
    if (expression instanceof jQueryAdapter) {
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
    }
  });

  function jQueryAdapter(elements) {
    if (elements instanceof jQueryAdapter) {
      return elements;
    }

    var ctx = this;
    elements = elements || [];
    ctx.length = elements.length;

    for (var i = 0; i < ctx.length; i++) {
      ctx[i] = elements[i];
    }
  }
  var _proto_ = jQueryAdapter.prototype;

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
    children: function(expr) {
      var result = [];
      this.each(function(elem) {
        result.combine(elem.getChildren(expr) || []);
      });
      return jQuery(result);
    },
    last: function(expr) {
      var children = this.children(expr);
      return jQuery(children[children.length - 1]);
    }
  });

  WIN[NAME] = jQuery;
})(window, $, $$, window.JQUERY_NAME || 'jQuery');
