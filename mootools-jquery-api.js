'use strict';
;(function(win) {
  var doc = win.document;

  function domReady (fn) {
    var done = false, top=true,
      doc = win.document, root = doc.documentElement,
      add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
      rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
      pre = doc.addEventListener ? '' : 'on',

      init = function(e) {
        if(e.type == 'readystatechange' && doc.readyState != 'complete') return;
        (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
        if(!done && (done=true)) fn.call(win, e.type || e);
      },

      poll = function() {
        try {root.doScroll('left');} catch(e) {setTimeout(poll, 50);return;}
        init('poll');
      };

    if(doc.readyState == 'complete') {
      fn.call(win, 'lazy');
    } else {
      if(doc.createEventObject && root.doScroll) {
        try {top =! win.frameElement;} catch(e) {}
        if(top) poll();
      }
      doc[add](pre + 'DOMContentLoaded', init, false);
      doc[add](pre + 'readystatechange', init, false);
      win[add](pre + 'load', init, false);
    }
  }
  function noop() {}
  function toCamelCase(str) {
    return str.replace(/[\-_](\w)/g, function(str, key) {
      return key.toUpperCase();
    });
  }
  function toArray(args) {
    return [].slice.call(args, 0);
  }
  function proxy(fn, ctx) {
    var args = toArray(arguments).slice(2);
    return function(){
      return fn.apply(ctx, args.concat(toArray(arguments)));
    };
  }

  /*
   * window.addEvent('domready') 绑定时机，如果延迟，就不会执行了
   * Function.bind 方法，对参数支持不友好
   * 拓展 [ready, proxy]
  */
  $.extend({
    ready: function(fn) {
      domReady(fn);
    },
    proxy: proxy
  });

  /*
   * 拓展元素的常用操作
   * [attr, removeAttr, html, text, val, css, show, hide, toggle, innerWidth, innerHeight, outerWidth, outerHeight, position, offset, data, index]
  */
  Element.implement({
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
    show: function() {
      var $el = this;
      var display = $el.getStyle('display');
      if (display === 'none') {
        // 如果一开始，就是隐藏的元素，应该找到它正确的 display 值
        $el.setStyle('display', '');
        display = $el.getStyle('display');

        // 真正显示
        var map = $el.retrieve('$show', { value: display });
        $el.setStyle('display', map.value);
      }
      return $el;
    },
    hide: function() {
      var $el = this;
      var display = $el.getStyle('display');
      if (display !== 'none') {
        var map = $el.retrieve('$show', { value: display });
        map.value = display;
        $el.setStyle('display', 'none');
      }
      return $el;
    },
    toggle: function() {
      var $el = this;
      var display = $el.getStyle('display');
      if (display === 'none') {
        $el.show();
      } else {
        $el.hide();
      }
      return $el;
    },
    innerWidth: function(width) {
      var ctx = this;
      if ($type(width)) {
        return ctx.setStyle('width', width);
      }
      var outerWidth = ctx.getWidth();
      var width = outerWidth - parseInt(ctx.getStyle('padding-left')) - parseInt(ctx.getStyle('padding-right'));
      return width;
    },
    innerHeight: function(height) {
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
    index: function($target) {
      var $el = this, result = -1;
      var $pt;
      if ($target) {
        $pt = $el;
        $el = $target;
      } else {
        $pt = $el.getParent();
      }
      $pt.getChildren().each(function(_$el, index) {
        if ($el === _$el) {
          result = index;
        }
      });
      return result;
    }
  });

  /*
   * 拓展动画部分，mootools 的动画，很强大，但是用着很不及jQuery友好
  */
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
            callback: proxy(callback, ctx),
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
    Element.implement(protoAnimate);

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
})(window);
