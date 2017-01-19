'use strict';
(function(CTX, _$, _$$) {
  var DOC = window.document;

  /**
	 * Dummy jQuery factory function
	 *
	 * @param  {element|string|object} expression
	 * @param  {DOMElement} context
	 * @return {DOM Element wrapped in Mootools}
	 */
  var jQuery = function(expression, context) {
    // 处理 jQuery('<html>').
    if (typeof expression === 'string' && !context){
      if (expression.charAt(0) === '<' && expression.chartAt(expression.length - 1) === '>'){
        var element = new Element('div', {
          html: expression
        }).getFirst();
        return element;
      }
    }

    if (typeof expression === 'object') {
      return DOC.id(expression);
    }

    if (typeof expression === 'function') {
      return CTX.addEvent('domready', expression);
    }

    // Handle jQuery(expression) and jQuery(expression, context).
    context = context || DOC;
    element = context.getElementById(expression) || context.getElements(expression);

    return element;
  };

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
      if ($type(html) == 'undefined') var ret = this.innerHTML;
      this.set('html', html);
      return this;
    },
    text: function(text) {
      if (!text) var ret = this.innerText;
      this.set('text', text);
      return this;
    },
    val: function(value) {
      var ret = (!value) ? this.getProperty("value") : this.setProperty("value", value);
      return ret;
    },
    append: function(content) {
        var ret = this.inject(content);
        return $extend(ret, jMethods);
    },
    prepend: function(content) {
        var ret = this.inject(content, 'parent');
        return $extend(ret, jMethods);
    },
    after: function(content) {
        var ret = this.inject(content, 'after');
        return $extend(ret, jMethods);
    },
    before: function(content) {
        var ret = this.inject(content, 'before');
        return $extend(ret, jMethods);
    },
    wrap: function(els) {
        var ret = this.wraps(els);
        return $extend(ret, jMethods);
    },
    add: function(expr) {
        var ret = ($type(expr) == 'string') ? this.set("html", expr) : this.inject(expr);
        return $extend(ret, jMethods);
    },
    remove: function() {
      return this.destroy();
    },
    css: function(name, value) {
        if ($type(name) == 'object') var ret = this.setStyles(name);
        var ret = (!value) ? this.getStyle(name) : this.setStyle(name, value);
        var ret = $extend(ret, jMethods);
        return $extend(ret, jMethods);
    },
    // children: function(expr) {
    //     var ret = this.getChildren(expr);
    //     return $extend(ret, jMethods);
    // },
    find: function(expr) {
      return jQuery(expr, this);
    },
    next: function(expr) {
        var ret = this.getNext(expr);
        return $extend(ret, jMethods);
    },
    nextAll: function(expr) {
        var ret = this.getNextAll(expr);
        return $extend(ret, jMethods);
    },
    parent: function(expr) {
        var ret = this.getParent(expr);
        return $extend(ret, jMethods);
    },
    parents: function(expr) {
        var ret = this.getParents(expr);
        return $extend(ret, jMethods);
    },
    prev: function(expr) {
        var ret = this.getPrevious(expr);
        return $extend(ret, jMethods);
    },
    prevAll: function(expr) {
        var ret = this.getAllPrevious(expr);
        return $extend(ret, jMethods);
    },
    bind: function(type, func) {
        var ret = this.addEvent(type, func);
        return $extend(ret, jMethods);
    },
    unbind: function(type, func) {
        var ret = this.removeEvent(type, func);
        return $extend(ret, jMethods);
    },
    blur: function(fn) {
        if ($type(fn) == 'function') var ret = this.addEvent("blur", fn);
        this.fireEvent("blur");
        return $extend(ret, jMethods);
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
    },
    ready: function(fn) {
        window.addEvent('domready', fn);
    }
  };

  var listMethods = {
    attr: function(name, value) {
      if (!$type(value)) {
        return jMethods.attr.call(this[0], name);
      }
      return jMethods.attr.call(this, name, value);
    }
  };

  Object.keys(jMethods).each(function(key) {
    Element.implement(key, jMethods[key]);
  });

  Object.keys(listMethods).each(function(key) {
    Elements.implement(key, listMethods[key]);
  });

  CTX.$ = jQuery;
})(window, $, $$);
