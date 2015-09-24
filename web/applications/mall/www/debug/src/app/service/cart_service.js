'use strict';
// 购物数据
angular
  .module('dachuwang')
  .factory('cartlist', ['$filter' , '$rootScope', function($filter , $rootScope) {
    var cartInfo = getInfo();
    var moneyFilter = $filter('money');
    // 获取数据
    function getInfo() {
      var obj = JSON.parse(localStorage.getItem('cartInfo'));
      if(!obj) {
        obj = {
          count: 0, // 购物车总个数
          sum: 0, // 购物车总金额
          items: {}, // 购物车清单
          ids: [], // 购物车的商品列表
          users: [], // 购物车的供应商列表
          change: 0,// 购物车商品信息是否发生变化
        };
        localStorage.setItem('cartInfo', JSON.stringify(obj));
      }
      return obj;
    }

    // 设置数据
    function setInfo(obj) {
      var info = {
        items: angular.isObject(obj.items) ? obj.items : {},
        ids: angular.isArray(obj.ids) ? obj.ids : [],
        users: angular.isArray(obj.users) ? obj.users : [],
        count: parseInt(obj.count) > 0 ? parseInt(obj.count) : 0,
        sum: parseFloat(obj.sum) > 0 ? parseFloat(obj.sum) : 0,
        change: parseInt(obj.change) > 0 ? parseInt(obj.change) : 0,
        validCount: parseInt(obj.validCount) > 0 ? parseInt(obj.validCount) : 0,
        validSum: parseInt(obj.validSum) > 0 ? parseInt(obj.validSum) : 0,
        validLen: parseInt(obj.validLen) > 0 ? parseInt(obj.validLen) : 0,
        allCheck: obj.allCheck > 0 ? obj.allCheck : false,
        validOrder : obj.validOrder ? obj.validOrder : []
      };
      info.sum = moneyFilter(info.sum, 2);
      return localStorage.setItem('cartInfo', JSON.stringify(info));
    }

    function clearInfo() {
      //var obj = JSON.parse(localStorage.getItem('cartInfo'));
      //if(!obj) {
      //  return ;
      //}
      //angular.forEach(obj.validOrder , function(v , k){
      //  angular.forEach(obj.items[0].list , function(vs , ks){
      //    if(v.id == vs.id){
      //       obj.items[0].list.splice(ks , 1);
      //       obj.ids.splice(ks , 1);
      //       obj.items[0].ids.splice(ks , 1);
      //       obj.count -- ;
      //    }
      //  })
      //})
      //obj.validCount = 0;
      //obj.validSum = 0;
      //obj.allCheck = false;
      //obj.validLen = 0;
      //obj.validOrder = [];

      var obj = JSON.parse(localStorage.getItem('cartInfo'));
      if(!obj) {
        return ;
      }
      angular.forEach(obj.validOrder , function(v , k){
        angular.forEach(obj.items[0].list , function(vs , ks){
          if(v.id == vs.id){
            changeItem(vs, -1, 0);
            checkValid(vs);
          }
        })
      })
    //  $rootScope.$emit('cartSumChange' , obj)
    }

    function getOrderDetail() {
      var data = [];
      var obj = JSON.parse(localStorage.getItem('cartInfo'));
      if(!obj){
        return ;
      }
      angular.forEach(obj.users, function(user_id) {
        angular.forEach(obj.validOrder, function(item) {
          if(item.quantity > 0) {
            data.push({
              title : item.title,
              id: item.id,
              location_id: item.location_id,
              price: item.price,
              quantity: item.quantity,
              category_id : item.category_id,
              sku_number : item.sku_number,
            });
          }
        });
      });
      return data;
    }

    /**
     * 修改购物车里某个供应商的商品列表
     */
    function _changeUserList(obj, item, pos, num) {
      if(!item || !item.id) {
        return;
      }
      obj.list = obj.list || [];
      obj.ids = obj.ids || [];
      obj.count = obj.count || 0;
      obj.sum = obj.sum || 0;

      var idx = obj.ids.indexOf(item.id);
      if(idx >= 0) {
        if(num && num > 0) {
          obj.list[idx].quantity = num;
        } else if (num <= 0) {
          obj.list[idx].quantity = 0;
        }else if(pos > 0) {
          obj.list[idx].quantity ++;
        } else if(pos < 0) {
          obj.list[idx].quantity --;
        }
        if(obj.list[idx].quantity <= 0) {
          obj.list.splice(idx, 1);
          obj.ids.splice(idx, 1);
        } else if (obj.list[idx].quantity > 9999) {
          obj.list[idx].quantity = 9999;
        }
      } else {
        if(num && num > 0) {
          item.quantity = num > 9999 ? 9999 : num;
        } else {
          item.quantity = 1;
        }
        obj.ids.push(item.id);
        obj.list.push(item);
      }
      var count = 0,
      sum = 0;
      angular.forEach(obj.list, function(it) {
        count += it.quantity;
        sum += it.quantity * it.price;
      });
      obj.count = count;
      obj.sum = sum;
      obj.sum = moneyFilter(obj.sum, 2);

      $rootScope.$emit('cartSumChange' , obj)
      return obj;
    }

    /** 修改购物车元素
     * @param item object 商品
     * @param int pos 加或减(1或-1)
     * @param int num 定值(大于0的整数)
     */
    function changeItem(item, pos, num) {

      var obj = JSON.parse(localStorage.getItem('cartInfo'));
      if(!item || !item.id) {
        return;
      }
      var uidx = obj.users.indexOf(item.user_id);
      if(uidx < 0) {
        obj.users.push(item.user_id);
        obj.items[item.user_id] = {};
      }
      obj.items[item.user_id] = _changeUserList(obj.items[item.user_id], item, pos, num);
      var count = 0,
      change = 0,
      sum = 0,
      ids = [],
      users = [],
      items = {};
      angular.forEach(obj.users, function(user_id) {
        angular.forEach(obj.items[user_id].list, function(item) {
          count += item.quantity;
          sum += item.quantity * item.price;
          ids.push(item.id);
          // 如果购物车中还存在已下架的商品，则设置change为1
          if(item.status == 0){
            change = 1;
          }
        });
        if(obj.items[user_id].count > 0) {
          users.push(user_id);
          items[user_id] = obj.items[user_id];
        }

      });
      obj.count  = count;
      obj.sum    = sum;
      obj.ids    = ids;
      obj.users  = users;
      obj.items  = items;
      obj.change = change;
      $rootScope.$emit('cartSumChange' , obj)
      setInfo(obj);
    }

    /**
     * 判断购物车中的商品所属的客户类型是否与该客户一致，清除购物车中不一致的商品
     * @param cus_type: 1 普通用户 2 KA用户
     */

    function clearItemsByCusType(cus_type) {
      var remove_ids = [];
      if(cartInfo.items['0']) {
        var len = common.length(cartInfo.items['0'].list);
        for( var i = 0; i < len; i++ ) {
          if(cartInfo.items['0'].list[i].customer_type != cus_type) {
            remove_ids.push(cartInfo.items['0'].list[i].id);
          }
        }
        for(var key in remove_ids) {
          for(var j = 0; j < len; j++) {
            if(isInArray(cartInfo.items['0'].list[j].id, remove_ids)) {
              changeItem(cartInfo.items['0'].list[j], -1, 0);
              j = 0;
              len = len -1;
            }
          }
        }
      }
    };
    /* 检查已确认商品
    * */
    var checkValid = function(item , isAll){
      var obj = JSON.parse(localStorage.getItem('cartInfo'));
      if(!obj.count && !obj.validCount){
        return ;
      }

      var check_isAll = function(isall){
        angular.forEach(obj.items[0].list , function( k , v){
            k.isChecked = isall;
        })
      }

      if(item && isAll){
        check_isAll(true);
      }else if(!item && isAll){
        check_isAll(false);
      }

      obj.validLen = obj.validCount = obj.validSum = 0 ;
      obj.validOrder = [];
      if(obj && obj.items['0'] && obj.items['0'].list.length){
        angular.forEach(obj.items[0].list , function( k , v){

          if(k.id == item.id){
            k.isChecked = item.isChecked;
          }
          if(k.isChecked){
            obj.validCount += k.quantity * 1;
            obj.validSum += k.quantity * k.price;
            obj.validLen ++;
            obj.validOrder.push(k);
          }
        })
        // 进来页面全选是否钩上
       obj.validLen == obj.ids.length && obj.validLen != 0 ? obj.allCheck = true : obj.allCheck = false ;
      }

      $rootScope.$emit('cartChange' , obj)

      setInfo(obj);
    }

    var isInArray = function (needle, haystack) {
      var length = haystack.length;
      for(var i = 0; i < length; i++) {
        if(haystack[i] == needle) return true;
      }
      return false;
    }

    var common = {
      'length':function (o){
          var t = typeof o;
          if(t == 'string'){
              return o.length;
          }else if(t == 'object'){
            var n = 0;
            for(var i in o){
                n++;
            }
            return n;
       }
         return false;
       }
    };

    return {
     ids : getInfo().ids ,
     count : getInfo().count ,
     changeItem : changeItem,
     getInfo    : getInfo,
     getDetail  : getOrderDetail,
     setInfo    : setInfo,
     clearInfo  : clearInfo,
     clearItemsByCusType : clearItemsByCusType,
     checkValid : checkValid
    };
}]);