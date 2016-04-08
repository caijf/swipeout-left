/*
 * Flip 左滑效果
 * By caijf
 * 支持amd，如不使用amd，可以使用全局变量Flip
 *
 * Date: 2016/4/07
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory;
    } else {
        root.Flip = factory();
    }
})(this, function() {

    /**
     * 标准化位置信息
     * @param e 事件对象
     * @returns {Object}
     */
    function getStandEvent(e) {
        var touches = e;
        if (e.touches && e.touches.length) {
            touches = e.touches[0];
        }
        if (e.changedTouches && e.changedTouches.length) {
            touches = e.changedTouches[0];
        }
        return $.extend({
            origin: {
                x: touches.pageX,
                y: touches.pageY
            }
        }, e);
    }

    //处理事件兼容问题
    var EVENT;
    if ('ontouchstart' in window) {
        EVENT = {
            START: 'touchstart',
            MOVE: 'touchmove',
            END: 'touchend'
        };
    } else {
        EVENT = {
            START: 'mousedown',
            MOVE: 'mousemove',
            END: 'mouseup'
        };
    }

    // CSS3 属性前缀兼容
    // transitionEnd事件兼容
    var vendorPrefix,
        fxTransform,
        fxTransition,
        transitionEnd = fxTransitionEnd();

    vendorPrefix = getVendorPrefix();

    if(vendorPrefix === ''){
        fxTransform = 'transform';
        fxTransition = 'transition';
    }else{
        fxTransform = vendorPrefix + 'Transform';
        fxTransition = vendorPrefix + 'Transition';
    }

    /**
     * css 属性前缀兼容
     * @return {String}
     */
    function getVendorPrefix() {    
        var body = document.body || document.documentElement,
            style = body.style,
            vendor = ["Moz", "Webkit", "Khtml", "O", "ms"]
            i = 0,
            len = vendor.length;

        while (i < len) {
            if (typeof style[vendor[i] + 'Transition'] === "string") {
                return '-' + vendor[i].toLowerCase() + '-';
            }
            i++;
        }
        return '';
    }

    /**
     * transitionEnd事件兼容
     * @return {[type]} [description]
     */
    function fxTransitionEnd() {
        var body = document.body || document.documentElement,
            style = body.style,
            transEndEventNames = {
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend',
                transition: 'transitionend'
            },
            result = 'transition';

        for (var name in transEndEventNames) {
            if (typeof style[name] === "string") {
                return transEndEventNames[name];
            }
        }

        return 'transitionend';
    };

    /**
     * 阻止点击事件执行、冒泡
     * @param  {Object} $el Zepto或jQuery dom对象
     */
    function preventClickFn($el) {
        $el && $el.on && $el.on('click', function click(e) {
            e.stopPropagation();
            e.preventDefault();
            $el.off('click', click);
        })
    }

    /**
     * @description 左滑删除
     * @param {Object} options
     * @param {String | Object} options.wrapper 事件委托父级，支持css选择器 或 Zepto dom对象。默认 'body'
     * @param {String} options.itemSelector 操作元素，目前仅支持css选择器。默认 'li'
     * @param {String} options.transClass 执行动画的元素的className，例如，我们作用元素是li，实际动画是在 li>.li-inner。默认 'li-inner'
     * @param {String} options.actionClass 右侧操作元素的className，例如，右侧我们放置了操作元素 li>.li-action。默认 'li-action'
     * @param {Boolean} options.dynamicLimit 动态获取操作区域的宽度，设置之后options.maxLimit改为动态获取，不影响options.toggleLimit、options.overstepLimit设置。默认 false
     * @param {Number} options.maxLimit 左滑距离，正常设置为右侧可操作元素的宽度。默认 -80
     * @param {Number} options.toggleLimit 滑出距离多少为滑出状态。默认 options.maxLimit / 2
     * @param {Number} options.overstepLimit 可超出距离。默认 options.maxLimit / 2
     * @param {Boolean} options.preventClick 阻止点击冒泡。默认 true
     * @param {Number} options.animateTime 滑动时间，单位ms。默认 300
     * @param {Boolean} options.animateDecrease 动态计算动画执行时间。如移动80px需要200ms，那么移动40px就只要100ms
     * @param {Function} options.disabledHandle 禁用条件函数。
     * @example
     *     var messageFlip = new Flip();
     *
     */
    function Flip(options) {

        //去除new字符串
        if (!(this instanceof Flip)) return new Flip(options);

        var self = this;

        // 参数覆盖
        var opt = $.extend({
            wrapper: 'body',
            itemSelector: 'li',
            transClass: 'li-inner',
            actionClass: 'li-action',
            dynamicLimit: false,
            preventClick: true,
            animateTime: 300,
            animateFunction: 'ease-out',
            animateDecrease: false,
            disabledHandle: null
        }, options);

        // 缓存dom
        var $dom = $(document),
            $wrapper = $(opt.wrapper);

        // 是否动态获取界限值（操作区域的宽度）
        if (!options.dynamicLimit) {
            // 偏移界限值
            opt.maxLimit = (opt.maxLimit && typeof opt.maxLimit === 'number') ? (opt.maxLimit > 0 ? -opt.maxLimit : opt.maxLimit) : -$wrapper.find(opt.itemSelector).eq(0).find('.' + opt.actionClass).width();
            opt.toggleLimit = (opt.toggleLimit && typeof opt.toggleLimit === 'number') ? (opt.toggleLimit > 0 ? -opt.toggleLimit : opt.toggleLimit) : opt.maxLimit / 2;
        }

        // 偏移可以超出范围
        opt.overstepLimit = (opt.overstepLimit && typeof opt.overstepLimit === 'number') ? (opt.overstepLimit > 0 ? -opt.overstepLimit : opt.overstepLimit) : 0;

        // 移动1px需要的时间（以毫秒为单位)
        var MOVETIME_ONEPIXEL = Math.floor(Math.abs(opt.animateTime / opt.maxLimit));

        var currentTarget = null, // 当前操作的dom对象
            transElement = null, // currentTarget内部滑出动画的元素
            origin = {
                x: 0, // 开始x轴坐标
                y: 0 // 开始y轴坐标
            },
            dir = '', // 判断touch方向，v为垂直，h为水平
            startTime; // 开始触发时间


        var isHideAnimate = false, // 标识隐藏过渡动画进行中，隐藏动画不能打断
            isRoll = false; // 标识是否存在滑出状态

        // 绑定事件
        $wrapper.on(EVENT.START, start);

        // 隐藏滑出dom
        function hideSlide() {

            // 防止重复隐藏动画
            if (isHideAnimate) return;

            // 标识隐藏过渡动画进行中
            isHideAnimate = true;

            var animateTime = opt.animateTime;

            // 动画时间根据距离计算
            if (opt.animateDecrease) {
                animateTime = Math.floor(MOVETIME_ONEPIXEL * Math.abs(__moveX - offsetObj.x) * 2)
            }

            // 执行隐藏动画
            slide(transElement, animateTime, {
                x: 0,
                y: 0
            }, function() {
                currentTarget = null;
                isRoll = false;
                isHideAnimate = false;
            });
        }

        // 显示滑出dom
        function showSlide() {

            // 防止重复隐藏动画
            if (isHideAnimate) return;

            // 执行滑出动画
            slide(transElement, opt.animateTime, {
                x: opt.maxLimit,
                y: 0
            }, function() {
                // 标识存在滑出状态
                isRoll = true;
            });
        }

        /**
         * @description 元素transform偏移
         * @param  {Object} $el       Zepto或jQuery dom对象
         * @param  {Object} offsetObj 偏移值，x轴和y轴，例如 {x: 0, y: 0}
         */
        function transform($el, offsetObj) {
            $el.css(fxTransform, 'translate3D(' + offsetObj.x + 'px,' + offsetObj.y + 'px, 0)')
                .attr('data-movex', offsetObj.x);
        }

        /**
         * transition动画
         * @param  {Object} $el           Zepto或jQuery dom对象
         * @param  {Number}   animateTime 动画执行时间
         * @param  {Object}   offsetObj   偏移值，x轴和y轴，例如 {x: 0, y: 0}
         * @param  {Function} callback    动画执行完回调函数
         */
        function slide($el, animateTime, offsetObj, callback) {

            var __moveX = $el.attr('data-movex') ? parseInt($el.attr('data-movex'), 10) : 0; // 移动距离

            var __animateTime = Math.floor(MOVETIME_ONEPIXEL * Math.abs(__moveX - offsetObj.x) * 2); // 移动时间

            if (__moveX == offsetObj.x) {
                callback && (typeof callback === 'function') && callback();
            } else {
                $el.css(fxTransition, 'transform ' + (animateTime) + 'ms ease-out 0s')
                    .attr({
                        'data-translatex': offsetObj.x,
                        'data-movex': offsetObj.x
                    })
                    .one(transitionEnd, function() {
                        $el.css(fxTransition, '');
                        callback && (typeof callback === 'function') && callback();
                    });

                transform($el, offsetObj);
            }
        }

        /**
         * 开始移动时触发
         * @param  {Object} e 事件对象
         */
        function start(e) {
            if (opt.disabledHandle && typeof opt.disabledHandle === 'function' && opt.disabledHandle()) {
                return;
            }

            var evt = getStandEvent(e);

            origin.x = evt.origin.x;
            origin.y = evt.origin.y;
            startTime = Date.now();

            var $target = $(e.target).parents(opt.itemSelector);

            // 初始化
            dir = '';

            // 存在滑出状态
            if (currentTarget && currentTarget.length > 0) {
                // 如果触摸的不是删除，移除当前状态
                if ($(e.target).hasClass(opt.actionClass) || $(e.target).parents('.' + opt.actionClass).length > 0) {
                    preventClickFn($target);
                } else {
                    preventClickFn($target);

                    // 阻止默认行为（滚动）
                    e.preventDefault();

                    // 隐藏滑出元素
                    hideSlide();

                    return;
                }
            }

            if ($target.length <= 0) return;

            currentTarget = $target;
            transElement = currentTarget.find('.' + opt.transClass);

            // 是否动态获取界限值（操作区域的宽度）
            if (options.dynamicLimit) {
                // 偏移界限值
                opt.maxLimit = -currentTarget.find('.' + opt.actionClass).width();
                opt.toggleLimit = opt.maxLimit / 2;
            }

            $dom.on(EVENT.MOVE, move);
            $dom.on(EVENT.END, end);
        }

        /**
         * 正在移动时触发
         * @param  {Object} e 事件对象
         */
        function move(e) {
            if (!currentTarget || !transElement) return;

            var evt = getStandEvent(e),
                tranX,
                moveX = evt.origin.x - origin.x,
                moveY = evt.origin.y - origin.y,
                absDistX = Math.abs(moveX),
                absDistY = Math.abs(moveY);

            // 取点判断方向
            if (!dir) {
                if (absDistX >= absDistY) {
                    dir = 'h';
                } else {
                    dir = 'v';
                }
            }

            // 水平滑动处理
            if (dir === 'h') {

                // 跟随移动
                tranX = parseInt(transElement.attr('data-translatex'), 10) || 0;
                tranX += moveX;

                // 边界值限定
                if (tranX < (opt.maxLimit + opt.overstepLimit)) {
                    tranX = opt.maxLimit + opt.overstepLimit;
                } else if (tranX > -opt.overstepLimit) {
                    tranX = -opt.overstepLimit;
                }

                transform(transElement, {
                    x: tranX,
                    y: 0
                });

                // 阻止默认事件
                e.preventDefault();
            } else {
                $dom.off(EVENT.MOVE, move);
                $dom.off(EVENT.END, end);

                end(e);
            }
        }

        /**
         * 移动结束时触发
         * @param  {Object} e 事件对象
         */
        function end(e) {
            if (!currentTarget || !transElement) return;

            var evt = getStandEvent(e),
                moveX = evt.origin.x - origin.x,
                tranX = 0,
                endTime = Date.now();

            tranX = parseInt(transElement.attr('data-translatex'), 10) || 0;
            tranX += moveX;

            // 滑动
            if (tranX < opt.toggleLimit) {
                showSlide();
            } else {
                hideSlide();
            }

            //鼠标按下事件（处理PC端中）
            if (opt.preventClick && EVENT.START === 'mousedown' && ((startTime && endTime - startTime > 300) || (dir === 'h' && Math.abs(moveX) > 3))) {
                preventClickFn(currentTarget);
                startTime = null;
            }

            // 阻止默认行为
            // e.preventDefault();

            $(document).off(EVENT.MOVE, move);
            $(document).off(EVENT.END, end);
        }

        /**
         * @method destroy 销毁函数
         */
        this.destroy = function() {
            $wrapper.off(EVENT.START);
            self.reset();
        }

        /**
         * @method reset 重置滑出状态
         */
        this.reset = function() {
            if (currentTarget) {
                hideSlide();
            }
        }

        /**
         * @method hasRollState 是否有滑出状态
         */
        this.hasRollState = function() {
            return isRoll;
        }
    }

    return Flip;

});