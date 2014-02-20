# Sortable
# @author  RubaXa <trash@rubaxa.org>, Blake Walters <blake@markupboy.com>
# @license MIT

((factory) ->
  "use strict"

  if typeof define is "function" and define.amd
    define factory
  else if typeof module isnt "undefined" and typeof module.exports isnt "undefined"
    module.exports = factory()
  else
    window["Sortable"] = factory();
)(->
  "use strict"

  dragEl =
  ghostEl =
  rootEl =
  nextEl =
  lastEl =
  lastCSS =
  activeGroup =
  tapEvt =
  touchEvt = undefined

  expando = 'Sortable' + (new Date).getTime()

  win = window
  document = win.document
  parseInt = win.parseInt
  _silent = false

  _createEvent = (event, item) ->
      evt = document.createEvent 'Event'
      evt.initEvent event, true, true
      evt.item = item
      evt

  noop = ->
  slice = [].slice

  touchDragOverListeners = []


  # @class  Sortable
  # @param  {HTMLElement}  el
  # @param  {Object}  [options]
  # @constructor

  class Sortable
    constructor: (el, options) ->
      @el = el # root element
      @options = options = options or {}

      # Defaults
      options.group = options.group or Math.random()
      options.handle = options.handle or null
      options.draggable = options.draggable or el.children[0] and el.children[0].nodeName or 'li'
      options.ghostClass = options.ghostClass or 'sortable-ghost'
      options.focusClass = options.focusClass or 'sortable-focus'
      options.ghostTopOffset = options.ghostTopOffset or 0
      options.ghostLeftOffset = options.ghostLeftOffset or 0
      options.ghostOpacity = options.ghostOpacity or '1'

      options.onAdd = _bind @, (options.onAdd or noop)
      options.onUpdate = _bind @, (options.onUpdate or noop)
      options.onRemove = _bind @, (options.onRemove or noop)


      # Export group name
      el[expando] = options.group

      # Bind all private methods
      for fn of @
        if fn.charAt(0) is '_'
          @[fn] = _bind @, @[fn]

      # Bind events
      _on el, 'add', options.onAdd
      _on el, 'update', options.onUpdate
      _on el, 'remove', options.onRemove

      _on el, 'mousedown', @_onTapStart
      _on el, 'touchstart', @_onTapStart
      _on el, 'selectstart', @_onTapStart

      _on el, 'dragover', @_onDragOver
      _on el, 'dragenter', @_onDragOver

      touchDragOverListeners.push @_onDragOver

    _applyEffects: ->
      _toggleClass dragEl, @options.ghostClass, true


    _onTapStart: (evt) ->
      touch = evt.touches and evt.touches[0]
      target = (touch or evt).target
      options =  @options
      el = @el

      if options.handle
        target = _closest target, options.handle, el

      target = _closest target, options.draggable, el

      #IE 9 Support
      if target and evt.type is 'selectstart'
        if target.tagName isnt 'A' and target.tagName isnt 'IMG'
          target.dragDrop()

      _toggleClass target, @options.focusClass, true


      if target and not dragEl and target.parentNode is el
        tapEvt = evt
        target.draggable = true

        # Disable "draggable"
        _find target, 'a', _disableDraggable
        _find target, 'img', _disableDraggable


        if touch
          # Touch device support
          tapEvt =
            target:  target
            clientX: touch.clientX
            clientY: touch.clientY

          @_onDragStart tapEvt, true
          evt.preventDefault()

        _on @el, 'touchend', @_onTapEnd
        _on @el, 'mouseup', @_onTapEnd

        _on @el, 'dragstart', @_onDragStart
        _on @el, 'dragend', @_onDrop

        _on document, 'dragover', _globalDragOver


        try
          if document.selection then document.selection.empty() else window.getSelection().removeAllRanges()
        catch err
          console.log err if console and typeof console.log is 'function'


    _emulateDragOver: ->
      if touchEvt
        _css ghostEl, 'display', 'none'

        target = document.elementFromPoint touchEvt.clientX, touchEvt.clientY

        parent = target
        group = @options.group
        i = touchDragOverListeners.length

        while parent
          if parent[expando] is group
            while i--
              touchDragOverListeners[i]
                clientX: touchEvt.clientX
                clientY: touchEvt.clientY
                target: target
                rootEl: parent
            break
          target = parent # store last element
          parent = parent.parentNode

        _css ghostEl, 'display', ''


    _onTouchMove: (evt) ->
      if tapEvt
        touch = evt.touches[0]
        dx = touch.clientX - tapEvt.clientX
        dy = touch.clientY - tapEvt.clientY

        touchEvt = touch
        _css ghostEl, 'webkitTransform', "translate3d(#{dx}px,#{dy}px,0)"


    _onDragStart: (evt, isTouch) ->
      target = evt.target
      dataTransfer = evt.dataTransfer

      rootEl = @el
      dragEl = target
      nextEl = target.nextSibling
      activeGroup = @options.group

      if isTouch
        rect = target.getBoundingClientRect()
        console.log rect
        css = _css(target)
        ghostRect

        ghostEl = target.cloneNode true

        _css ghostEl, 'top', rect.top + @options.ghostTopOffset
        _css ghostEl, 'left', rect.left + @options.ghostLeftOffset
        _css ghostEl, 'width', rect.width
        _css ghostEl, 'height', rect.height
        _css ghostEl, 'opacity', @options.ghostOpacity
        _css ghostEl, 'position', 'fixed'
        _css ghostEl, 'zIndex', '100000'

        rootEl.appendChild ghostEl

        # Fixing dimensions.
        ghostRect = ghostEl.getBoundingClientRect()
        _css ghostEl, 'width', rect.width*2 - ghostRect.width
        _css ghostEl, 'height', rect.height*2 - ghostRect.height

        # Bind touch events
        _on document, 'touchmove', @_onTouchMove
        _on document, 'touchend', @_onDrop

        @_loopId = setInterval @_emulateDragOver, 150

      else
        dataTransfer.effectAllowed = 'move'
        dataTransfer.setData 'Text', target.textContent

        _on document, 'drop', @_onDrop

      setTimeout @_applyEffects


    _onDragOver: (evt) ->
      if not _silent and activeGroup is @options.group and (evt.rootEl is undefined or evt.rootEl is @el)
        el = @el
        target = _closest evt.target, @options.draggable, el

        if el.children.length is 0 or el.children[0] is ghostEl
          el.appendChild dragEl
        else if target and target isnt dragEl and target.parentNode[expando] isnt undefined
          if lastEl isnt target
            lastEl = target
            lastCSS = _css target

          rect = target.getBoundingClientRect()
          width = rect.right - rect.left
          height = rect.bottom - rect.top
          floating = /left|right|inline/.test lastCSS.cssFloat + lastCSS.display
          skew = (if floating then (evt.clientX - rect.left)/width else (evt.clientY - rect.top)/height) > .5
          isWide = target.offsetWidth > dragEl.offsetWidth
          isLong = target.offsetHeight > dragEl.offsetHeight
          nextSibling = target.nextSibling
          after = null

          _silent = true
          setTimeout _unsilent, 30

          if floating
            after = target.previousElementSibling is dragEl and not isWide or skew > .5 and isWide
          else
            after = target.nextElementSibling isnt dragEl and not isLong or skew > .5 and isLong;

          if after and not nextSibling
            el.appendChild dragEl
          else
            target.parentNode.insertBefore dragEl, (if after then nextSibling else target)


    _onDrop: (evt) ->
      clearInterval this._loopId

      # Unbind events
      _off document, 'drop', @_onDrop
      _off document, 'dragover', _globalDragOver

      _off @el, 'dragend', @_onDrop
      _off @el, 'dragstart', @_onDragStart

      _off document, 'touchmove', @_onTouchMove
      _off document, 'touchend', @_onDrop


      if evt
        evt.preventDefault()
        evt.stopPropagation()

        ghostEl.parentNode.removeChild ghostEl if ghostEl


        if dragEl
          _toggleClass dragEl, @options.focusClass, false
          _toggleClass dragEl, @options.ghostClass, false

          if not rootEl.contains dragEl
            # Remove event
            rootEl.dispatchEvent _createEvent 'remove', dragEl

            # Add event
            dragEl.dispatchEvent _createEvent 'add', dragEl

          else if dragEl.nextSibling isnt nextEl
            # Update event
            dragEl.dispatchEvent _createEvent 'update', dragEl

        # Set NULL
        rootEl =
        dragEl =
        ghostEl =
        nextEl =

        tapEvt =
        touchEvt =

        lastEl =
        lastCSS =

        activeGroup = null

    _onTapEnd: (evt) ->
      target = _closest evt.target, @options.draggable, @el
      _toggleClass target, @options.focusClass, false


    destroy: ->
      el = @el
      options = @options

      _off el, 'add', options.onAdd
      _off el, 'update', options.onUpdate
      _off el, 'remove', options.onRemove

      _off el, 'mousedown', @_onTapStart
      _off el, 'touchstart', @_onTapStart

      _off el, 'dragover', @_onDragOver
      _off el, 'dragenter', @_onDragOver

      # _off @el, 'touchend', @_onTapEnd
      # _off @el, 'mouseup', @_onTapEnd

      #remove draggable attributes
      Array.prototype.forEach.call el.querySelectorAll('[draggable]'), (el) ->
        el.removeAttribute 'draggable'

      touchDragOverListeners.splice touchDragOverListeners.indexOf(@_onDragOver), 1

      @_onDrop()

      @el = null


  _bind = (ctx, fn) ->
    args = slice.call arguments, 2
    if fn.bind
      fn.bind.apply(fn, [ctx].concat(args))
    else
      return ->
        return fn.apply(ctx, args.concat(slice.call(arguments)))

  _closest = (el, selector, ctx) ->
    if el
      ctx = ctx or document
      selector = selector.split '.'

      tag = selector.shift().toUpperCase()
      re = new RegExp('\\s(' + selector.join('|') + ')\\s', 'g')

      test = ->
        (tag is '' or el.nodeName is tag) and (not selector.length or (" #{el.className} ".match(re) or []).length is selector.length)

      if test()
        return el

      el = el.parentNode

      while el isnt ctx and el
        if test()
          return el
        el = el.parentNode

    return null



  _globalDragOver = (evt) ->
    evt.dataTransfer.dropEffect = 'move'
    evt.preventDefault()

  _on = (el, event, fn) ->
    el.addEventListener event, fn, false


  _off = (el, event, fn) ->
    el.removeEventListener event, fn, false

  _toggleClass = (el, name, state) ->
    if el
      if el.classList
        el.classList[if state then 'add' else 'remove'] name
      else
        className = (" #{el.className} ").replace(/\s+/g, ' ').replace(" #{name} ", '')
        el.className = className + (if state then " #{name}" else '')


  _css = (el, prop, val) ->
    if el and el.style
      if val is undefined
        if document.defaultView and document.defaultView.getComputedStyle
          val = document.defaultView.getComputedStyle el, ''
        else if el.currentStyle
          val = el.currentStyle
        return if prop is undefined then val else val[prop]
      else
        el.style[prop] = val + (if typeof val is 'string' then '' else 'px')


  _find = (ctx, tagName, iterator) ->
    if ctx
      list = ctx.getElementsByTagName(tagName)
      iterator item, i for item, i in list if iterator
      return list
    return  []


  _disableDraggable = (el) ->
    el.draggable = false


  _unsilent = ->
    _silent = false


  # Export utils
  Sortable.utils =
    on: _on
    off: _off
    css: _css
    find: _find
    bind: _bind
    closest: _closest
    toggleClass: _toggleClass


  Sortable.version = '0.2.1';

  # Export
  return  Sortable
)
