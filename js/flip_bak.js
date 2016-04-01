define([], function(){

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
        return _.extend({
            origin: {
                x: touches.clientX,
                y: touches.clientY
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

    /**
     * flip类
     * @param option 配置
     * @returns {flip} 返回flip实现
     */
    function flip(option) {
        //去除new字符串
        if (this instanceof flip) return new flip(option);

        //子级内容的选择器
        var opt = _.extend({
            itemSelector: 'li.flip-item',
            maxLimit: -66,
            preventClick: true,
            animateClass: 'myhotel-touch-inertia'
        }, option);
        opt.toggleLimit = opt.toggleLimit || opt.maxLimit / 2;


        //保存当前要拖动的对象
        var currentTarget = null,
            origin = {
                x: 0,
                y: 0
            },
            startTime,         //记录开始移动的接口
            sMov = false;      //标识第一次移动方法，用来作方向判断，如果为tre，则会判断方向，否则不会判断方向
        opt.$el.on(EVENT.START, startMoving);

        /**
         * 开始移动时触发
         * @param e
         */
        function startMoving(e) {
            var target = $(e.target).parents(opt.itemSelector),
                evt = getStandEvent(e);
            if (!target.length) return;
            currentTarget = target;
            currentTarget.children().removeClass(opt.animateClass);
            var pos = ~~(currentTarget.children().css('transform') || currentTarget.children().css('-webkit-transform') || currentTarget.children().css('-moz-transform') || currentTarget.children().css('-ms-transform') || "").match(/[-\d]+/);
            origin.x = evt.origin.x - pos;
            origin.y = evt.origin.y;
            //绑定对应事件
            $(document).on(EVENT.MOVE, moving);
            $(document).on(EVENT.END, movExit);
            startTime = Date.now();
            sMov = true;
        }

        /**
         * 正在移动时触发
         * @param e
         */
        function moving(e) {
            if (!currentTarget) return;
            var evt = getStandEvent(e),
                tranX = evt.origin.x - origin.x;
            if(sMov && Math.abs(evt.origin.y - origin.y) > 5) {
                $(document).off(EVENT.MOVE, moving);
                $(document).off(EVENT.END, movExit);
                movExit(e);
                return ;
            }

            if(sMov) {
                var alltarget = opt.$el.find(opt.itemSelector).not(currentTarget);
                var str = 'translateX(0px)';
                alltarget.children().css({
                    '-webkit-transform': str,
                    '-moz-transform': str,
                    '-ms-transform': str,
                    'transform': str
                });
                sMov = false;
            }

            //阻止默认事件
            e.preventDefault();
            if(tranX <= opt.maxLimit) tranX = opt.maxLimit;
            if(tranX >= 0) tranX = 0;
            var str = 'translateX(' + tranX + 'px)';
            currentTarget.children().css({
                '-webkit-transform': str,
                '-moz-transform': str,
                '-ms-transform': str,
                'transform': str
            });
        }

        /**
         * 移动结束时触发
         * @param e
         */
        function movExit(e) {
            if (!currentTarget) return;
            var evt = getStandEvent(e),
                tranX = evt.origin.x - origin.x,
                tg = 0,endTime = Date.now();
            if(tranX > 0) tranX = 0;
            if(tranX < opt.maxLimit) tranX = opt.maxLimit;
            if(tranX < opt.toggleLimit) {
                tg = opt.maxLimit;
            }

            tg = 'translateX(' + tg + 'px)';
            var child = currentTarget.children().addClass(opt.animateClass);
            //强制浏览器进行绘制
            child.position();
            _.defer(function(){
                child.css({
                    '-webkit-transform': tg,
                    '-moz-transform': tg,
                    '-ms-transform': tg,
                    'transform': tg
                });
            });

            //鼠标按下事件（处理PC端中）
            if(opt.preventClick && EVENT.START === 'mousedown' && startTime && endTime - startTime > 300) {
                opt.$el.on('click',function click(e){
                    e.stopPropagation();
                    e.preventDefault();
                    opt.$el.off('click', click);
                });
                startTime = null;
            }
            //鼠标事件
            currentTarget = null;
            //恢复状态
            sMov = false;
            $(document).off(EVENT.MOVE, moving);
            $(document).off(EVENT.END, movExit);
        }

        this.destroy = function(){
            opt.$el(EVENT.START, startMoving);
        };
    }
    return flip;
});