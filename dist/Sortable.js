(function() {
  (function(factory) {
    "use strict";
    if (typeof define === "function" && define.amd) {
      return define(factory);
    } else if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
      return module.exports = factory();
    } else {
      return window["Sortable"] = factory();
    }
  })(function() {
    "use strict";
    var Sortable, activeGroup, document, dragEl, expando, ghostEl, lastCSS, lastEl, nextEl, noop, parseInt, rootEl, slice, tapEvt, touch, touchDragOverListeners, touchEvt, win, _bind, _closest, _createEvent, _css, _disableDraggable, _find, _globalDragOver, _off, _on, _silent, _toggleClass, _unsilent;
    dragEl = ghostEl = rootEl = nextEl = lastEl = lastCSS = activeGroup = tapEvt = touchEvt = touch = void 0;
    expando = 'Sortable' + (new Date).getTime();
    win = window;
    document = win.document;
    parseInt = win.parseInt;
    _silent = false;
    _createEvent = function(event, item) {
      var evt;
      evt = document.createEvent('Event');
      evt.initEvent(event, true, true);
      evt.item = item;
      return evt;
    };
    noop = function() {};
    slice = [].slice;
    touchDragOverListeners = [];
    Sortable = (function() {
      function Sortable(el, options) {
        var fn;
        this.el = el;
        this.options = options = options || {};
        this.moved = false;
        options.group = options.group || Math.random();
        options.handle = options.handle || null;
        options.draggable = options.draggable || el.children[0] && el.children[0].nodeName || 'li';
        options.ghostClass = options.ghostClass || 'sortable-ghost';
        options.focusClass = options.focusClass || 'sortable-focus';
        options.ghostTopOffset = options.ghostTopOffset || 0;
        options.ghostLeftOffset = options.ghostLeftOffset || 0;
        options.ghostOpacity = options.ghostOpacity || '1';
        options.onAdd = _bind(this, options.onAdd || noop);
        options.onUpdate = _bind(this, options.onUpdate || noop);
        options.onRemove = _bind(this, options.onRemove || noop);
        el[expando] = options.group;
        for (fn in this) {
          if (fn.charAt(0) === '_') {
            this[fn] = _bind(this, this[fn]);
          }
        }
        _on(el, 'add', options.onAdd);
        _on(el, 'update', options.onUpdate);
        _on(el, 'remove', options.onRemove);
        _on(el, 'mousedown', this._onTapStart);
        _on(el, 'touchstart', this._onTapStart);
        _on(el, 'selectstart', this._onTapStart);
        _on(el, 'dragover', this._onDragOver);
        _on(el, 'dragenter', this._onDragOver);
        touchDragOverListeners.push(this._onDragOver);
      }

      Sortable.prototype._applyEffects = function() {
        return _toggleClass(dragEl, this.options.ghostClass, true);
      };

      Sortable.prototype._onTapStart = function(evt) {
        var el, err, options, target;
        touch = evt.touches && evt.touches[0];
        target = (touch || evt).target;
        options = this.options;
        el = this.el;
        if (options.handle) {
          target = _closest(target, options.handle, el);
        }
        target = _closest(target, options.draggable, el);
        if (target && evt.type === 'selectstart') {
          if (target.tagName !== 'A' && target.tagName !== 'IMG') {
            target.dragDrop();
          }
        }
        _toggleClass(target, this.options.focusClass, true);
        if (target && !dragEl && target.parentNode === el) {
          tapEvt = evt;
          target.draggable = true;
          _find(target, 'a', _disableDraggable);
          _find(target, 'img', _disableDraggable);
          if (touch) {
            tapEvt = {
              target: target,
              clientX: touch.clientX,
              clientY: touch.clientY
            };
            this._onDragStart(tapEvt, true);
            evt.preventDefault();
          }
          _on(this.el, 'touchend', this._onTapEnd);
          _on(this.el, 'mouseup', this._onTapEnd);
          _on(this.el, 'dragstart', this._onDragStart);
          _on(this.el, 'dragend', this._onDrop);
          _on(document, 'dragover', _globalDragOver);
          try {
            if (document.selection) {
              return document.selection.empty();
            } else {
              return window.getSelection().removeAllRanges();
            }
          } catch (_error) {
            err = _error;
            if (console && typeof console.log === 'function') {
              return console.log(err);
            }
          }
        }
      };

      Sortable.prototype._emulateDragOver = function() {
        var group, i, parent, target;
        if (touchEvt) {
          _css(ghostEl, 'display', 'none');
          target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
          parent = target;
          group = this.options.group;
          i = touchDragOverListeners.length;
          while (parent) {
            if (parent[expando] === group) {
              while (i--) {
                touchDragOverListeners[i]({
                  clientX: touchEvt.clientX,
                  clientY: touchEvt.clientY,
                  target: target,
                  rootEl: parent
                });
              }
              break;
            }
            target = parent;
            parent = parent.parentNode;
          }
          return _css(ghostEl, 'display', '');
        }
      };

      Sortable.prototype._onTouchMove = function(evt) {
        var dx, dy;
        this.moved = true;
        if (tapEvt) {
          touch = evt.touches[0];
          dx = touch.clientX - tapEvt.clientX;
          dy = touch.clientY - tapEvt.clientY;
          touchEvt = touch;
          return _css(ghostEl, 'webkitTransform', "translate3d(" + dx + "px," + dy + "px,0)");
        }
      };

      Sortable.prototype._onDragStart = function(evt, isTouch) {
        var css, dataTransfer, ghostRect, rect, target;
        target = evt.target;
        dataTransfer = evt.dataTransfer;
        rootEl = this.el;
        dragEl = target;
        nextEl = target.nextSibling;
        activeGroup = this.options.group;
        if (isTouch) {
          rect = target.getBoundingClientRect();
          css = _css(target);
          ghostEl = target.cloneNode(true);
          _css(ghostEl, 'top', rect.top + this.options.ghostTopOffset - parseInt(css.marginTop, 10));
          _css(ghostEl, 'left', rect.left + this.options.ghostLeftOffset - parseInt(css.marginTop, 10));
          _css(ghostEl, 'width', rect.width);
          _css(ghostEl, 'height', rect.height);
          _css(ghostEl, 'opacity', this.options.ghostOpacity);
          _css(ghostEl, 'position', 'fixed');
          _css(ghostEl, 'zIndex', '100000');
          rootEl.appendChild(ghostEl);
          ghostRect = ghostEl.getBoundingClientRect();
          _css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
          _css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
          _on(document, 'touchmove', this._onTouchMove);
          _on(document, 'touchend', this._onDrop);
          this._loopId = setInterval(this._emulateDragOver, 150);
        } else {
          dataTransfer.effectAllowed = 'move';
          dataTransfer.setData('Text', target.textContent);
          _on(document, 'drop', this._onDrop);
        }
        return setTimeout(this._applyEffects);
      };

      Sortable.prototype._onDragOver = function(evt) {
        var after, el, floating, height, isLong, isWide, nextSibling, rect, skew, target, width;
        if (!_silent && activeGroup === this.options.group && (evt.rootEl === void 0 || evt.rootEl === this.el)) {
          el = this.el;
          target = _closest(evt.target, this.options.draggable, el);
          if (el.children.length === 0 || el.children[0] === ghostEl) {
            return el.appendChild(dragEl);
          } else if (target && target !== dragEl && target.parentNode[expando] !== void 0) {
            if (lastEl !== target) {
              lastEl = target;
              lastCSS = _css(target);
            }
            rect = target.getBoundingClientRect();
            width = rect.right - rect.left;
            height = rect.bottom - rect.top;
            floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display);
            skew = (floating ? (evt.clientX - rect.left) / width : (evt.clientY - rect.top) / height) > .5;
            isWide = target.offsetWidth > dragEl.offsetWidth;
            isLong = target.offsetHeight > dragEl.offsetHeight;
            nextSibling = target.nextSibling;
            after = null;
            _silent = true;
            setTimeout(_unsilent, 30);
            if (floating) {
              after = target.previousElementSibling === dragEl && !isWide || skew > .5 && isWide;
            } else {
              after = target.nextElementSibling !== dragEl && !isLong || skew > .5 && isLong;
            }
            if (after && !nextSibling) {
              return el.appendChild(dragEl);
            } else {
              return target.parentNode.insertBefore(dragEl, (after ? nextSibling : target));
            }
          }
        }
      };

      Sortable.prototype._onDrop = function(evt) {
        clearInterval(this._loopId);
        _off(document, 'drop', this._onDrop);
        _off(document, 'dragover', _globalDragOver);
        _off(this.el, 'dragend', this._onDrop);
        _off(this.el, 'dragstart', this._onDragStart);
        _off(document, 'touchmove', this._onTouchMove);
        _off(document, 'touchend', this._onDrop);
        if (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          if (ghostEl) {
            ghostEl.parentNode.removeChild(ghostEl);
          }
          if (dragEl) {
            _toggleClass(dragEl, this.options.focusClass, false);
            _toggleClass(dragEl, this.options.ghostClass, false);
            if (!rootEl.contains(dragEl)) {
              rootEl.dispatchEvent(_createEvent('remove', dragEl));
              dragEl.dispatchEvent(_createEvent('add', dragEl));
            } else if (dragEl.nextSibling !== nextEl) {
              dragEl.dispatchEvent(_createEvent('update', dragEl));
            }
          }
          return rootEl = dragEl = ghostEl = nextEl = tapEvt = touchEvt = lastEl = lastCSS = activeGroup = null;
        }
      };

      Sortable.prototype._onTapEnd = function(evt) {
        var target;
        target = _closest(evt.target, this.options.draggable, this.el);
        _toggleClass(target, this.options.focusClass, false);
        if (target && touch && !this.moved) {
          target.dispatchEvent(_createEvent('click', target));
        }
        return this.moved = false;
      };

      Sortable.prototype.destroy = function() {
        var el, options;
        el = this.el;
        options = this.options;
        _off(el, 'add', options.onAdd);
        _off(el, 'update', options.onUpdate);
        _off(el, 'remove', options.onRemove);
        _off(el, 'mousedown', this._onTapStart);
        _off(el, 'touchstart', this._onTapStart);
        _off(el, 'dragover', this._onDragOver);
        _off(el, 'dragenter', this._onDragOver);
        Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function(el) {
          return el.removeAttribute('draggable');
        });
        touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);
        this._onDrop();
        return this.el = null;
      };

      return Sortable;

    })();
    _bind = function(ctx, fn) {
      var args;
      args = slice.call(arguments, 2);
      if (fn.bind) {
        return fn.bind.apply(fn, [ctx].concat(args));
      } else {
        return function() {
          return fn.apply(ctx, args.concat(slice.call(arguments)));
        };
      }
    };
    _closest = function(el, selector, ctx) {
      var re, tag, test;
      if (el) {
        ctx = ctx || document;
        selector = selector.split('.');
        tag = selector.shift().toUpperCase();
        re = new RegExp('\\s(' + selector.join('|') + ')\\s', 'g');
        test = function() {
          return (tag === '' || el.nodeName === tag) && (!selector.length || ((" " + el.className + " ").match(re) || []).length === selector.length);
        };
        if (test()) {
          return el;
        }
        el = el.parentNode;
        while (el !== ctx && el) {
          if (test()) {
            return el;
          }
          el = el.parentNode;
        }
      }
      return null;
    };
    _globalDragOver = function(evt) {
      evt.dataTransfer.dropEffect = 'move';
      return evt.preventDefault();
    };
    _on = function(el, event, fn) {
      return el.addEventListener(event, fn, false);
    };
    _off = function(el, event, fn) {
      return el.removeEventListener(event, fn, false);
    };
    _toggleClass = function(el, name, state) {
      var className;
      if (el) {
        if (el.classList) {
          return el.classList[state ? 'add' : 'remove'](name);
        } else {
          className = (" " + el.className + " ").replace(/\s+/g, ' ').replace(" " + name + " ", '');
          return el.className = className + (state ? " " + name : '');
        }
      }
    };
    _css = function(el, prop, val) {
      if (el && el.style) {
        if (val === void 0) {
          if (document.defaultView && document.defaultView.getComputedStyle) {
            val = document.defaultView.getComputedStyle(el, '');
          } else if (el.currentStyle) {
            val = el.currentStyle;
          }
          if (prop === void 0) {
            return val;
          } else {
            return val[prop];
          }
        } else {
          return el.style[prop] = val + (typeof val === 'string' ? '' : 'px');
        }
      }
    };
    _find = function(ctx, tagName, iterator) {
      var i, item, list, _i, _len;
      if (ctx) {
        list = ctx.getElementsByTagName(tagName);
        if (iterator) {
          for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
            item = list[i];
            iterator(item, i);
          }
        }
        return list;
      }
      return [];
    };
    _disableDraggable = function(el) {
      return el.draggable = false;
    };
    _unsilent = function() {
      return _silent = false;
    };
    Sortable.utils = {
      on: _on,
      off: _off,
      css: _css,
      find: _find,
      bind: _bind,
      closest: _closest,
      toggleClass: _toggleClass
    };
    Sortable.version = '0.2.1';
    return Sortable;
  });

}).call(this);
