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

    function Flip(options){

        //去除new字符串
        if (this instanceof Flip) return new Flip(options);

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
            animateClass: 'transition',
            animateTime: 200,
            disabledHandle: null // 禁用条件函数
        }, options);

        // 偏移界限值
        opt.toggleLimit = opt.toggleLimit || opt.maxLimit / 2;

        // 内部变量
        var currentTarget = null, // 当前操作的dom对象
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

        // 偏移量
        function transform($el, x){
            $el.css({
                '-webkit-transform': 'translateX('+ x +'px)',
                'transform': 'translateX('+ x +'px)'
            });
        }

        // 偏移动画
        function slide($el, x, callback){

            $el.addClass(opt.animateClass).attr('data-translateX', x);
            transform($el, x);
            setTimeout(function(){
                $el.removeClass(opt.animateClass);
                callback && (typeof callback === 'function') && callback();
            }, opt.animateTime);
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

            // 存在删除状态
            if(self.isFlip){
                // 如果触摸的不是删除，移除当前状态
                if(!$(e.target).hasClass(opt.deleteClass)){
                    $target.on('click',function click(e){
                        e.stopPropagation();
                        e.preventDefault();
                        $target.off('click', click);
                    });

                    // 阻止默认行为（滚动）
                    e.preventDefault();

                    self.hideSlide();
                    return;
                }else{
                    $target.on('click',function click(e){
                        e.stopPropagation();
                        e.preventDefault();
                        $target.off('click', click);
                    });
                }
            }

            currentTarget = $target;

            $dom.on(EVENT.MOVE, move);
            $dom.on(EVENT.END, end);

        }

        function move(e){
            if (!currentTarget) return;

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
                tranX = parseInt(currentTarget.find('.' + opt.transClass).attr('data-translateX'), 10) || 0;
                tranX += moveX;

                // 边界值限定
                if(tranX < (opt.maxLimit + opt.overstepLimit)){
                    tranX = opt.maxLimit + opt.overstepLimit;
                }else if(tranX > 0){
                    tranX = 0;
                }

                transform(currentTarget.find('.' + opt.transClass), tranX);

                // 阻止默认行为（滚动）
                e.preventDefault();
            }else{
                $dom.off(EVENT.MOVE, move);
                $dom.off(EVENT.END, end);

                end(e);
            }
        }

        function end(e){
            if (!currentTarget) return;

            var evt = getStandEvent(e),
                moveX = evt.origin.x - origin.x,
                tranX = 0,
                endTime = Date.now();

            tranX = parseInt(currentTarget.find('.' + opt.transClass).attr('data-translateX'), 10) || 0;
            tranX += moveX;

            self.isFlip = true;

            // 滑动
            if(tranX < opt.toggleLimit){
                self.showSlide();
            }else{
                self.hideSlide();
            }

            //鼠标按下事件（处理PC端中）
            if(opt.preventClick && EVENT.START === 'mousedown' && startTime && endTime - startTime > 300) {
                currentTarget.on('click',function click(e){
                    e.stopPropagation();
                    e.preventDefault();
                    currentTarget.off('click', click);
                });
                startTime = null;
            }

            // 阻止默认行为
            e.preventDefault();

            $(document).off(EVENT.MOVE, move);
            $(document).off(EVENT.END, end);

        }

        // 初始化，事件绑定
        this.init = function(){
            $(opt.wrapper).on(EVENT.START, start);
        }

        // 存在滑出状态，只要元素移出原本的位置都为 true
        this.isFlip = false;

        // 隐藏滑出dom
        this.hideSlide = function(){

            // 标识正在进行隐藏过渡动画
            if(isFlipAnimate) return;

            isFlipAnimate = true;

            slide(currentTarget.find('.' + opt.transClass), 0, function(){
                currentTarget = null;
                self.isFlip = false;
                isFlipAnimate = false;
            });
        }

        this.showSlide = function(){

            // 标识正在进行隐藏过渡动画
            if(isFlipAnimate) return;

            slide(currentTarget.find('.' + opt.transClass), opt.maxLimit);
        }

        // 销毁
        this.destroy = function(){
            $(opt.wrapper).off(EVENT.START);
        }

        // 如果处于滑出状态，则重置
        this.reset = function(){
            if(self.isFlip){
                self.hideSlide();
            }
        }

        this.init();
    }

    return Flip;

});