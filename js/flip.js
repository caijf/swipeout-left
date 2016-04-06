define(['zepto'], function($){

    /**
     * 标准化位置信息
     * @param e
     * @returns {Object}
     */
    function getStandEvent(e){
        var touches = e;
        if(e.touches && e.touches.length){
            touches = e.touches[0];
        }
        if(e.changedTouches && e.changedTouches.length){
            touches = e.changedTouches[0];
        }
        return $.extend({
            origin: {
                x: touches.pageX,
                y: touches.pageY
            }
        },e);
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

    // 前缀处理
    var body=document.body || document.documentElement,
        style=body.style,
        vendorPrefix,
        transitionEnd;

    vendorPrefix = (function(){
        var vendor = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
            i = 0,
            len = vendor.length;

        while(i < len){
            if(typeof style[vendor[i] + 'transition'] === 'string'){
                return vendor;
            }
            i++;
        }
        return '';
    })();

    transitionEnd = (function(){
        var transEndEventNames = {
              WebkitTransition : 'webkitTransitionEnd',
              MozTransition    : 'transitionend',
              OTransition      : 'oTransitionEnd otransitionend',
              transition       : 'transitionend'
            };

        for(var name in transEndEventNames){
            if(typeof style[name] === "string"){
                return transEndEventNames[name]
            }
        }
    })();

     // 阻止点击事件执行、冒泡
     function preventClickFn($el){

        $el.on('click', function click(e){
            e.stopPropagation();
            e.preventDefault();
            $el.off('click', click);
        })
     }

    // 偏移量
    function transform($el, offsetObj){
        $el.css(vendorPrefix + 'transform', 'translate3D('+ offsetObj.x +'px,' + offsetObj.y + 'px, 0)')
            .attr('data-moveX', offsetObj.x);
    }

    // 偏移动画
    function slide($el, animateTime, offsetObj, callback){

        if($el.attr('data-moveX') == offsetObj.x){
            callback && (typeof callback === 'function') && callback();
        }else{
            $el.css(vendorPrefix + 'transition', 'transform ' + animateTime + 'ms ease-out 0s')
                .attr({
                    'data-translateX': offsetObj.x,
                    'data-moveX': offsetObj.x
                })
                .one(transitionEnd, function(){
                    $el.css(vendorPrefix + 'transition', '');
                    callback && (typeof callback === 'function') && callback();
                });

            transform($el, offsetObj);
        }

    }

     /**
      * [Flip description]
      * @param {[type]} options [description]
      */
    function Flip(options){

        //去除new字符串
        // if (this instanceof Flip) return new Flip(options);

        var self = this;

        // 参数覆盖
        var opt = $.extend({
            wrapper: 'body',
            itemSelector: 'li',
            transClass: 'li-inner',
            deleteClass: 'delete',
            maxLimit: -80,
            overstepLimit: -40,
            preventClick: true,
            // animateClass: 'transition',
            animateTime: 200,
            disabledHandle: null // 禁用条件函数
        }, options);

        // 偏移界限值
        opt.toggleLimit = opt.toggleLimit || opt.maxLimit / 2;

        // 内部变量
        var currentTarget = null, // 当前操作的dom对象
            transElement = null, // currentTarget内部滑出动画的元素
            origin = {
                x: 0, // 开始x轴坐标
                y: 0 // 开始y轴坐标
            },
            dir = '', // 判断touch方向，v为垂直，h为水平
            startTime; // 开始触发时间

        // 缓存dom
        var $dom = $(document),
            $wrapper = $(opt.wrapper);

        // 标识正在进行隐藏过渡动画
        var isFlipAnimate = false;

        // 存在滑出状态，只要元素移出原本的位置都为 true
        var isFlip = false;

        // 绑定事件
        $(opt.wrapper).on(EVENT.START, start);

        // 隐藏滑出dom
        function hideSlide(){

            // 标识正在进行隐藏过渡动画
            if(isFlipAnimate) return;

            isFlipAnimate = true;

            slide(transElement, opt.animateTime, {x: 0, y: 0}, function(){
                currentTarget = null;
                isFlip = false;
                isFlipAnimate = false;
                console.log('callback isFlip: ' + isFlip);
            });
        }

        // 显示滑出dom
        function showSlide(){

            // 标识正在进行隐藏过渡动画
            if(isFlipAnimate) return;

            slide(transElement, opt.animateTime, {x: opt.maxLimit, y: 0});
        }

        function start(e){
            if(opt.disabledHandle && typeof opt.disabledHandle === 'function' && opt.disabledHandle()){
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
            if(currentTarget && currentTarget.length > 0){
                // 如果触摸的不是删除，移除当前状态
                if($(e.target).hasClass(opt.deleteClass)){
                    preventClickFn($target);
                }else{
                    preventClickFn($target);

                    // 阻止默认行为（滚动）
                    e.preventDefault();

                    hideSlide();

                    return;
                }
            }

            currentTarget = $target;

            transElement = currentTarget.find('.' + opt.transClass);

            $dom.on(EVENT.MOVE, move);
            $dom.on(EVENT.END, end);
        }

        function move(e){
            if (!currentTarget || !transElement) return;

            var evt = getStandEvent(e),
                tranX,
                moveX = evt.origin.x - origin.x,
                moveY = evt.origin.y - origin.y,
                absDistX = Math.abs(moveX),
                absDistY = Math.abs(moveY);

            // 取点判断方向
            if(!dir){
                if(absDistX >= absDistY){
                    dir = 'h';
                }else{
                    dir = 'v';
                }
            }

            // 水平滑动处理
            if(dir === 'h'){

                // 跟随移动
                tranX = parseInt(transElement.attr('data-translateX'), 10) || 0;
                tranX += moveX;

                // 边界值限定
                if(tranX < (opt.maxLimit + opt.overstepLimit)){
                    tranX = opt.maxLimit + opt.overstepLimit;
                }else if(tranX > 0){
                    tranX = 0;
                }

                transform(transElement, {x: tranX, y: 0});

                // 阻止默认行为（滚动）
                e.preventDefault();
            }else{
                $dom.off(EVENT.MOVE, move);
                $dom.off(EVENT.END, end);

                end(e);
            }
        }

        function end(e){
            if (!currentTarget || !transElement) return;

            var evt = getStandEvent(e),
                moveX = evt.origin.x - origin.x,
                tranX = 0,
                endTime = Date.now();

            tranX = parseInt(transElement.attr('data-translateX'), 10) || 0;
            tranX += moveX;

            // 滑动
            if(tranX < opt.toggleLimit){
                isFlip = true;
                showSlide();
            }else{
                hideSlide();
            }

            //鼠标按下事件（处理PC端中）
            if(opt.preventClick && EVENT.START === 'mousedown' && ((startTime && endTime - startTime > 300) || Math.abs(moveX) > 5)) {
                preventClickFn(currentTarget);
                startTime = null;
            }

            // 阻止默认行为
            e.preventDefault();

            $(document).off(EVENT.MOVE, move);
            $(document).off(EVENT.END, end);
        }

        // 销毁
        this.destroy = function(){
            $(opt.wrapper).off(EVENT.START);
            self.reset();
        }

        // 如果处于滑出状态，则重置
        this.reset = function(){
            if(currentTarget){
                hideSlide();
            }
        }

        // 当前是否有滑出状态
        this.hasFlip = function(){
            return (currentTarget && currentTarget.length) ? true : false;
        }
    }

    return Flip;

});