'use strict';
// 给 mootools 模拟 jquery 的语法糖
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
        element = new Element('div', {
          html: expression
        }).getFirst();
        return _$$(element);
      }
    }

    if (typeof expression === 'object') {
      return _$$(expression);
    }

    if (typeof expression === 'function') {
      return domReady(expression);
    }

    // Handle jQuery(expression) and jQuery(expression, context).
    context = context || DOC;
    expression = expression.trim();

    // if (!/[^0-9a-zA-Z\-_]/.test(expression) && !context) {
    //   // 兼容 mootools，获取单个id元素 $('xxxx')
    //   element = document.id(expression, true, DOC);
    // } else {
      element = context.getElements(expression);
    // }

    return element;
  }

  jQuery.ready = function(fn) {
    fn && domReady(fn);
  }

  // 插入元素
  function grabElements(ctx, content, where) {
    var elems = jQuery(content),
      where = where || 'bottom';
    if (elems && elems.length) {
      elems.each(function(elem) {
        ctx.grab(elem, where);
      });
    } else {
      ctx.grab(elems, where);
    }
    return ctx;
  }

  var jMethods = jQuery.fn = {
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

    // 在 mootools 中被保护了
    appendElem: function(content) {
      return grabElements(this, content, 'bottom');
    },
    prependElem: function(content) {
      return grabElements(this, content, 'top');
    },
    after: function(content) {
      return grabElements(this, content, 'after');
    },
    before: function(content) {
      return grabElements(this, content, 'before');
    },

    wrap: function(elems) {
      var $wrap = jQuery(elems);
      var parentNode = this.parentNode;

      $wrap = $wrap.length ? $wrap[0] : $wrap;
      parentNode.replaceChild($wrap, this);
      $wrap.appendElem(this);

      return this;
    },
    parent: function(expr) {
      return this.getParent(expr);
    },
    parents: function(expr) {
      return this.getParents(expr);
    },

    remove: function() {
      return this.destroy();
    },

    find: function(expr) {
      return jQuery(expr, this);
    },
    next: function(expr) {
      return jQuery(this.getNext(expr));
    },
    nextAll: function(expr) {
      return jQuery(this.getAllNext(expr));
    },
    prev: function(expr) {
      return jQuery(this.getPrevious(expr));
    },
    prevAll: function(expr) {
      return jQuery(this.getAllPrevious(expr));
    },

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

    blur: function(fn) {
      if ($type(fn) == 'function') {
        return this.addEvent('blur', fn);
      }
      this['blur'] ? this['blur']() : this.fireEvent('blur');
      return this;
    },
    focus: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("focus", fn);
        this.fireEvent("focus");
        return $extend(ret, jMethods);
    },
    load: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("load", fn);
        this.fireEvent("load");
        return $extend(ret, jMethods);
    },
    resize: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("resize", fn);
        this.fireEvent("resize");
        return $extend(ret, jMethods);
    },
    scroll: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("scroll", fn);
        this.fireEvent("scroll");
        return $extend(ret, jMethods);
    },
    unload: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("unload", fn);
        this.fireEvent("unload");
        return $extend(ret, jMethods);
    },
    click: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("click", fn);
        this.fireEvent("click");
        return $extend(ret, jMethods);
    },
    dblclick: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("dblclick", fn);
        this.fireEvent("dblclick");
        return $extend(ret, jMethods);
    },
    mousedown: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("mousedown", fn);
        this.fireEvent("mousedown");
        return $extend(ret, jMethods);
    },
    mouseup: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("mouseup", fn);
        this.fireEvent("mouseup");
        return $extend(ret, jMethods);
    },
    mousemove: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("mousemove", fn);
        this.fireEvent("mousemove");
        return $extend(ret, jMethods);
    },
    mouseover: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("mouseover", fn);
        this.fireEvent("mouseover");
        return $extend(ret, jMethods);
    },
    mouseout: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("mouseout", fn);
        this.fireEvent("mouseout");
        return $extend(ret, jMethods);
    },
    mouseenter: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("mouseenter", fn);
        this.fireEvent("mouseenter");
        return $extend(ret, jMethods);
    },
    mouseleave: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("mouseleave", fn);
        this.fireEvent("mouseleave");
        return $extend(ret, jMethods);
    },
    change: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("change", fn);
        this.fireEvent("change");
        return $extend(ret, jMethods);
    },
    select: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("select", fn);
        this.fireEvent("select");
        return $extend(ret, jMethods);
    },
    submit: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("submit", fn);
        this.fireEvent("submit");
        return $extend(ret, jMethods);
    },
    keydown: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("keydown", fn);
        this.fireEvent("keydown");
        return $extend(ret, jMethods);
    },
    keypress: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("keypress", fn);
        this.fireEvent("keypress");
        return $extend(ret, jMethods);
    },
    keyup: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("keyup", fn);
        this.fireEvent("keyup");
        return $extend(ret, jMethods);
    },
    error: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("error", fn);
        this.fireEvent("error");
        return $extend(ret, jMethods);
    }
  };


  function getListAdaptMethod(method, index) {
    var fn = jMethods[method];
    return function() {
      var args = arguments;
      var val = args[index || 0];
      if (!$type(val)) {
        return fn.apply(this[0], args);
      }
      return fn.apply(this, args);
    };
  }
  function getListErgodicMethod(method) {
    var fn = jMethods[method];
    return function() {
      var args = arguments, result = [];
      this.each(function($r) {
        var _fn = fn || $r[method];
        result.combine(_fn.apply($r, args));
      });
      return jQuery(result);
    }
  }

  var listMethods = {
    attr: getListAdaptMethod('attr', 1),
    html: getListAdaptMethod('html', 0),
    text: getListAdaptMethod('text', 0),
    val: getListAdaptMethod('val', 0),
    css: getListAdaptMethod('css', 1),

    children: getListErgodicMethod('getChildren'),
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
      var children = this.children();
      return jQuery(children[children.length - 1]);
    },

    find: getListErgodicMethod('find'),
    next: getListErgodicMethod('next'),
    nextAll: getListErgodicMethod('nextAll'),
    prev: getListErgodicMethod('prev'),
    prevAll: getListErgodicMethod('prevAll')
  };


  Object.keys(jMethods).each(function(key) {
    Element.implement(key, jMethods[key]);
  });

  Object.keys(listMethods).each(function(key) {
    Elements.implement(key, listMethods[key]);
  });

  WIN[NAME] = jQuery;
})(window, $, $$, window.JQUERY_NAME || 'jQuery');
