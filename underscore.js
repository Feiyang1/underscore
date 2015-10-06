(function () {
	var root = self;
	var _ = function (object) {
		if (object instanceof _) return object;
		if (!(this instanceof _)) return new _(object);
		this.wrapped = object;
	};

	root._ = _;

	_.each = each;
	_.times = times;
	_.mixin = mixin;
	_.include = include;

	_.map = map;
	
	// weird stuff
	_.prototype.value = function () { return this.wrapped; };
	_.property = function (key) {
		return function (obj) {
			return obj == null ? void 0 : obj[key];
		};
	};
	
	//place holders 
	// Create a reducing function iterating left or right.
	var createReduce = function (dir) {
		// Optimized iterator function as using arguments.length
		// in the main function will deoptimize the, see #1991.
		var reducer = function (obj, iteratee, memo, initial) {
			var keys = !isArrayLike(obj) && _.keys(obj),
				length = (keys || obj).length,
				index = dir > 0 ? 0 : length - 1;
			if (!initial) {
				memo = obj[keys ? keys[index] : index];
				index += dir;
			}
			for (; index >= 0 && index < length; index += dir) {
				var currentKey = keys ? keys[index] : index;
				memo = iteratee(memo, obj[currentKey], currentKey, obj);
			}
			return memo;
		};

		return function (obj, iteratee, memo, context) {
			var initial = arguments.length >= 3;
			return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
		};
	};

	var optimizeCb = function (func, context, argCount) {
		if (context === void 0) return func;
		switch (argCount == null ? 3 : argCount) {
			case 1: return function (value) {
				return func.call(context, value);
			};
			// The 2-parameter case has been omitted only because no current consumers
			// made use of it.
			case 3: return function (value, index, collection) {
				return func.call(context, value, index, collection);
			};
			case 4: return function (accumulator, value, index, collection) {
				return func.call(context, accumulator, value, index, collection);
			};
		}
		return function () {
			return func.apply(context, arguments);
		};
	};
	
	var cb = function(func, context){
		if(func == null) return _.identity;
		else if(_.isFunction(func)) 
			return function(){
				return func.apply(context, arguments);
			};
		else if(_.isObject(func)) return _.matcher(func);
		else return _.property(func);
	};

	_.reduce = createReduce(1);


	_.chain = function (obj) {
		var instance = _(obj);
		instance._chain = true;
		return instance;
	};
    _.toArray = function (obj) {
		if (!obj) return [];
		if (_.isArray(obj)) return slice.call(obj);
		if (isArrayLike(obj)) return _.map(obj, _.identity);
		return _.values(obj);
	};
	
	//objects
	_.keys = keys;
	_.allKeys = allKeys;
	_.values = values;
	_.pairs = pairs;
	_.invert = invert;
	_.functions = _.methods = functions;
	_.extend = extend;
	_.extendOwn = _.assign = extendOwn;
	_.pick = pick;
	_.has = has;
	_.omit = omit;
	_.defaults = defaults;
	_.isNaN = isNaN1;
	_.clone = clone;
	_.create = create;
	
	//arrays
	_.last = last;

	_.range = function (stop) {
		var results = [];

		for (var i = 0; i < stop; i++) {
			results.push(i);
		}

		return results;
	};
	
	var contains = function(array, object){
		if(!isArrayLike(array)) return false;
		for(var i = 0 ; i < array.length; i++){
			if(object === array[i]) return true;
		}
		return false;
	};
	
	_.uniq = function(array, isSorted, iteratee, context){
		if(array == null) return [];
		if(!_.isBoolean(isSorted)){
			context = iteratee;
			iteratee = isSorted;
			isSorted = false;
		}
		var myIteratee = cb(iteratee, context);
		var seen = [], results = [];
		
		for(var i = 0; i < array.length; i ++){
			var value = myIteratee(array[i], i, array);
			if(contains(seen, value)) continue;
			results.push(array[i]);
			seen.push(value);
		}
		
		return results;
	};
	
	
	// utilities
	_.constant = constant;
	
	var uniqueIdMap = { global: 0};
	_.uniqueId = function(prefix){
		if(prefix){
			if(uniqueIdMap[prefix] == null)
				uniqueIdMap[prefix] = 0;
			return prefix + uniqueIdMap[prefix] ++;	
		}
		
		return uniqueIdMap['global'] ++;
	};
	
	_.now = Date.now || function(){ new Date().getTime();};

	_.noConflict = function () {
		return this;
	};

	_.noop = function () {
	};

	_.random = function (min, max) {
		if (max == null) { max = min, min = 0; }

		return min + Math.floor(Math.random() * (max - min) + 1);
	};

	_.identity = function (value) {
		return value;
	};

	_.propertyOf = function (obj) {
		return obj == null ? function () { } : function (key) {
			return obj[key];
		};
	};
	
	// functions
	
	_.partial = function (funct) {
		var wrapperArgs = arguments;
		var partialFunc = function () {
			var args = [];
			for (var i = 1, k = 0; i < wrapperArgs.length; i++) {
				if (wrapperArgs[i] === _.partial.placeholder) {
					args[i - 1] = arguments[k++];
				}
				else args[i - 1] = wrapperArgs[i];
			}

			for (var j = k; j < arguments.length; j++) {
				args.push(arguments[j]);
			}

			if (this instanceof partialFunc) { // constructor function
				var self = new funct;
				funct.apply(self, args);
				return self;
			}

			return funct.apply(this, args);
		};
		return partialFunc;
	};

	_.partial.placeholder = _;
	
	// arrays
	function last(array, n) {
		if (array == null) return array;

		if (n == null)
			return array[array.length - 1];

		var start = Math.max(0, array.length - n);

		return Array.prototype.slice.call(array, start);
	}

	// collections
	
	_.every = function (list, predicate, context) {
		if (list == null || !_.isFunction(predicate)) return false;

		for (var i = 0; i < list.length; i++) {
			if(!predicate.call(context, list[i])) return false;;
		}

		return true;
	};
	
	_.some = function(list, predicate, context){
		if (list == null || !_.isFunction(predicate)) return false;

		for (var i = 0; i < list.length; i++) {
			if(predicate.call(context, list[i])) return true;;
		}

		return false;
	};

	_.where = function (list, properties) {

		var result = [];

		if (!list) return result;
		if (typeof list.length === 'number' && list.length >= 0) {// iterate array/array like objects
			for (var i = 0; i < list.length; i++) {
				if (_.isFunction(properties) && properties.apply(null, [list[i], i, list]) || !_.isFunction(properties) && _.isMatch(list[i], properties)) {
					result.push(list[i]);
				}
			}
		}
		else { // iterate object
			for (var prop in list) {
				if (list.hasOwnProperty(prop)) {
					if (_.isFunction(properties) && properties.apply(null, [list[prop], prop, list]) || !_.isFunction(properties) && _.isMatch(list[prop], properties))
						result.push(list[prop]);
				}
			}
		}

		return result;
	};

	_.find = function (list, predicate, context) {
		if (!list) return void 0;
		if (typeof list.length === 'number' && list.length >= 0) {// iterate array/array like objects
			for (var i = 0; i < list.length; i++) {
				if (_.isFunction(predicate) && predicate.apply(context, [list[i], i, list]) || !_.isFunction(predicate) && _.isMatch(list[i], predicate)) {
					return list[i];
				}
			}
		}
		else { // iterate object
			for (var prop in list) {
				if (list.hasOwnProperty(prop)) {
					if (_.isFunction(predicate) && predicate.apply(context, [list[prop], prop, list]) || !_.isFunction(predicate) && _.isMatch(list[prop], predicate)) return list[prop];
				}
			}
		}
		return void 0;
	};

	_.max = function (list, iteratee, context) {
		if (list == null || list.length === 0) return - Infinity;
		var myIteratee = _.isFunction(iteratee) ? iteratee : _.identity, max = - Infinity;

		for (var i = 0; i < list.length; i++) {
			if (myIteratee.call(context, list[i]) > max) max = myIteratee.call(context, list[i]);
		}

		return max;
	};

	_.compact = function (list) {
		return _.filter(list, _.identity);
	};

	_.filter = function (list, predicate) {
		if (list == null || !_.isFunction(predicate)) return [];

		var output = [];
		for (var i = 0; i < list.length; i++) {
			predicate.call(arguments[2], list[i]) ? output.push(list[i]) : void 0;
		}

		return output;
	};

	function map(list, iteratee, context) {
		if (list == null) return [];

		var output = [], myIteratee = iteratee;

		if (Object.prototype.toString.call(iteratee) === '[object String]') {
			myIteratee = function (object) {
				return object[iteratee];
			};
		}

		for (var i = 0; i < list.length; i++) {
			output.push(myIteratee.call(context, list[i], i, list));
		}

		return output;
	}

	function each(input, callback, context) {
		if (!input) return input;
		if (typeof input.length === 'number' && input.length >= 0) {// iterate array/array like objects
			for (var i = 0; i < input.length; i++) {
				callback.apply(context, [input[i], i, input]);
			}
		}
		else { // iterate object
			for (var prop in input) {
				if (input.hasOwnProperty(prop)) {
					callback.apply(context, [input[prop], prop, input]);
				}
			}
		}
		return input;
	}
	
	//objects
	
	_.mapObject = function (object, iteratee, context) {
		if (!_.isObject(object)) return {};

		var myIteratee;
		if (_.isFunction(iteratee)) myIteratee = iteratee;
		else if (_.isObject(iteratee)) myIteratee = _.matcher(iteratee);
		else myIteratee = _.property(iteratee);


		var keys = _.keys(object), results = {};
		for (var i = 0; i < keys.length; i++) {
			results[keys[i]] = myIteratee.call(context, object[keys[i]], keys[i], object);
		}

		return results;
	};

	_.findKey = function (object, predicate, context) {
		var pairs = _.pairs(object);
		var myPredicate;
		if (_.isFunction(predicate)) myPredicate = predicate;
		else if (_.isObject(predicate)) myPredicate = _.matcher(predicate);
		else myPredicate = _.property(predicate);

		for (var i = 0; i < pairs.length; i++) {
			if (myPredicate.call(context, pairs[i][1], pairs[i][0], object)) {
				return pairs[i][0];
			}
		}
	};

	_.matcher = function (attrs) {
		var localAttrs = _.extendOwn({}, attrs);
		return function (object) {
			return _.isMatch(object, localAttrs);
		};
	};

	_.each(['String', 'Array', 'Arguments', 'Number', 'Boolean', 'Function', 'Date', 'RegExp', 'Error'], function (value) {
		_['is' + value] = function (object) {
			return getType(object) === '[object ' + value + ']';
		};
	});

	function isPrimitive(object) {
		return object == null || _.isString(object) || _.isNumber(object) || _.isBoolean(object);
	}

	_.isMatch = function (object, properties) {
		if (object == null && _.isEmpty(properties)) return true;
		if (isPrimitive(object)) return false;
		var pairs = _.pairs(properties);

		for (var i = 0; i < pairs.length; i++) {
			if (!(pairs[i][0] in object) || !_.isEqual(object[pairs[i][0]], pairs[i][1])) return false;
		}

		return true;
	};

	_.tap = function (object, interceptor) {
		interceptor(object);
		return object;
	};

	_.isNull = function (object) {
		return object === null;
	};

	_.isUndefined = function (object) {
		return object === void 0;
	}

	_.isFinite = function (object) {
		return isFinite(object) && !_.isNaN(parseFloat(object));
	};

	_.isElement = function (object) {
		return !!(object && object.nodeType === 1);
	};

	function isArrayLike(object) {
		if (object == null) return false;
		var length = object.length;
		return typeof length === 'number' && length >= 0;
	}

	_.isEmpty = function (object) {
		if (object == null) return true;
		if (getType(object) === '[object Array]' || isArrayLike(object)) return object.length === 0;
		return _.keys(object).length === 0;
	};

	_.isObject = function (object) {
		var typ = typeof object;
		return typ === 'function' || typ === 'object' && !!object;
	};

	function getType(object) {
		return Object.prototype.toString.call(object);
	}
	
	// returns - 1 if it's not a circular reference
	// returns the level of its parent on the stack if it is a circular reference
	function getCircularLevel(object, objectStack) {
		for (var i = 0; i < objectStack.length; i++) {
			if (object === objectStack[i]) return i;
		}
		return -1;
	}

	function recursiveCompare(object, other, objectStack, otherStack) {

		if (object instanceof _) object = object.wrapped;
		if (other instanceof _) other = other.wrapped;

		var objectType = getType(object), otherType = getType(other), objCircularLevel, otherCircularLevel;

		if (otherType !== objectType) return false;

		if (objectType === '[object Number]' && otherType === '[object Number]') {

			if (object.valueOf() != object.valueOf() && other.valueOf() != other.valueOf()) /// NaN check
				return true;

			return 1 / object === 1 / other;
		}
		else if ((objectType === '[object String]' && otherType === '[object String]') ||
			(objectType === '[object Boolean]' && otherType === '[object Boolean]') ||
			(objectType === '[object Date]' && otherType === '[object Date]')) {
			return object.valueOf() === other.valueOf();
		}
		else if (objectType === '[object Function]' && otherType === '[object Function]') {
			return object === other;
		}
		else if (objectType === '[object RegExp]' && otherType === '[object RegExp]') {
			var objectParts = object.toString().split('/'), otherParts = other.toString().split('/');
			if (objectParts.length === otherParts.length && (objectParts[0] === otherParts[0] && objectParts[1] === otherParts[1])) {
				if (objectParts.length === 3) {// if flag exists
					if (objectParts[2].length === otherParts[2].length) {
						for (var i = 0; i < objectParts[2].length; i++) {
							if (otherParts[2].indexOf(objectParts[2][i]) < 0) return false;
						}
						return true;
					}
					return false;
				}
				return true;
			}

			return false;
		}
		else if (objectType === '[object Array]' && otherType === '[object Array]') { // special logic for array because of sparse array
			if (object.length !== other.length) return false;

			objectStack.push(object), otherStack.push(other); // for circular reference detection
			for (var i = 0; i < object.length; i++) {

				objCircularLevel = getCircularLevel(object[i], objectStack), otherCircularLevel = getCircularLevel(other[i], otherStack);

				if (objCircularLevel >= 0 && objCircularLevel === otherCircularLevel) continue; // equivalent circular reference
				else if (objCircularLevel >= 0 && objCircularLevel !== otherCircularLevel) {
					return false;
				}

				if (!recursiveCompare(object[i], other[i], objectStack, otherStack)) {
					return false;
				}
			}

			objectStack.pop(), otherStack.pop();
			return true;
		}

		if (object === other) return true;
		
		//object object
		if (objectType === '[object Object]' && otherType === '[object Object]' && (object.constructor === other.constructor || object.constructor === void 0 || other.constructor === void 0)) {

			var objectAllKeys = _.allKeys(object), otherAllKeys = _.allKeys(other);

			if (objectAllKeys.length !== otherAllKeys.length) return false;

			objectStack.push(object), otherStack.push(other); // for circular reference detection
			for (var i = 0; i < objectAllKeys.length; i++) {

				if (!(objectAllKeys[i] in other)) return false;

				objCircularLevel = getCircularLevel(object[objectAllKeys[i]], objectStack), otherCircularLevel = getCircularLevel(other[objectAllKeys[i]], otherStack);

				if (objCircularLevel >= 0 && objCircularLevel === otherCircularLevel) continue; // equivalent circular reference
				else if (objCircularLevel >= 0 && objCircularLevel !== otherCircularLevel) {
					return false;
				}

				if (!recursiveCompare(object[objectAllKeys[i]], other[objectAllKeys[i]], objectStack, otherStack))
					return false;
			}

			objectStack.pop(), otherStack.pop();
			return true;
		}

		return false;
	}
	_.isEqual = function (object, other) {
		var objectStack = [], otherStack = [];
		return recursiveCompare(object, other, objectStack, otherStack);
	};

	function create(prototype, props) {
		var Factory = function () { }, obj;
		Factory.prototype = prototype;

		obj = _.extendOwn(new Factory(), props);

		return obj;
	}

	function clone(object) {
		if (!(object instanceof Object)) return object;
		var cloned = {}, keys = _.allKeys(object);

		for (var i = 0; i < keys.length; i++) {
			cloned[keys[i]] = object[keys[i]];
		}

		return cloned;
	}

	function keys(object) {
		var keys = [];
		if (!_.isObject(object)) return keys;
		for (var prop in object) {
			if (Object.prototype.hasOwnProperty.call(object, prop)) {
				keys.push(prop);
			}
		}
		return keys;
	}

	function allKeys(object) {
		var keys = [];
		if (!_.isObject(object)) return keys;
		for (var prop in object) {
			keys.push(prop);
		}
		return keys;
	}

	function values(object) {
		var values = [];
		if (!_.isObject(object)) return values;
		for (var prop in object) {
			if (Object.prototype.hasOwnProperty.call(object, prop)) {
				values.push(object[prop]);
			}
		}
		return values;
	}

	function pairs(object) {
		var pairs = [];
		if (!_.isObject(object)) return pairs;
		for (var prop in object) {
			var keyValue;
			if (Object.prototype.hasOwnProperty.call(object, prop)) {
				keyValue = [prop, object[prop]];
				pairs.push(keyValue);
			}
		}
		return pairs;
	}

	function invert(object) {
		var pairs = _.pairs(object);
		var newObject = new Object();
		_.each(pairs, function (item) {
			newObject[item[1]] = item[0];
		});

		return newObject;
	}

	function functions(object) {
		var functions = [];
		if (!(object instanceof Object)) return functions;
		var keys = _.allKeys(object);

		_.each(keys, function (key) {
			if (object[key] instanceof Function)
				functions.push(key);
		});

		return functions;
	}

	function extend(destination) {
		if (destination == null) return destination;
		var sources = Array.prototype.slice.call(arguments);
		Array.prototype.splice.call(sources, 0, 1);
		_.each(sources, function (source) {
			var keys = _.allKeys(source);
			_.each(keys, function (key) {
				destination[key] = source[key];
			});
		});

		return destination;
	}

	function extendOwn(destination) {
		if (destination == null) return destination;
		var sources = Array.prototype.slice.call(arguments);
		_.each(sources, function (source) {
			var keys = _.keys(source);
			_.each(keys, function (key) {
				destination[key] = source[key];
			});
		});
		return destination;
	}

	function pick(object) {

		var output = {}, obj = Object(object);
		if (arguments.length < 2 || object == null) return output;

		if (typeof arguments[1] == 'function') {
			var callback = arguments[1], context = arguments[2];
			_.each(_.allKeys(obj), function (key) {
				if (callback.call(context, obj[key], key, obj)) {
					output[key] = obj[key];
				}
			});
		}
		else {
			for (var i = 1; i < arguments.length; i++) {
				var arg = arguments[i];
				if (arg.constructor == Array) {
					for (var k = 0; k < arg.length; k++) {
						if (arg[k] in obj) {
							output[arg[k]] = obj[arg[k]];
						}
					}
				}
				else {
					if (arg in obj) {
						output[arg] = obj[arg];
					}
				}

			}
		}

		return output;
	}

	function omit(object) {
		var output = {}, obj = Object(object), keys;

		if (object == null) return output;
		
		//copy object
		for (var prop in obj) {
			output[prop] = obj[prop];
		}

		var callback = arguments[1];
		var context = arguments[2];
		if (typeof callback == 'function') {
			keys = _.allKeys(obj);
		}
		else {
			callback = function (value, key, object) {
				return key in object;
			};
			context = output;

			keys = [];
			for (var i = 1; i < arguments.length; i++) {
				if (arguments[i] instanceof Array) {
					for (var k = 0; k < arguments[i].length; k++) {
						keys.push(arguments[i][k]);
					}
				}
				else
					keys.push(arguments[i]);
			}
		}

		_.each(keys, function (key) {
			if (callback.call(context, output[key], key, obj)) {
				delete output[key];
			}
		});

		return output;
	}

	function has(object, key) {
		if (object == null) return false;
		return Object.prototype.hasOwnProperty.call(object, key);
	}

	function defaults(object) {

		if (!(object instanceof Object)) object = {};

		for (var i = 1; i < arguments.length; i++) {
			var def = arguments[i];

			for (var prop in def) {
				if (object[prop] === void 0) object[prop] = def[prop];;
			}
		}

		return object;
	}

	function isNaN1(object) {
		if (toString.call(object) !== '[object Number]') return false;

		return isNaN(object);
	}

	// utilities
	function times(n, iteratee, context) {
		var arr = [];
		for (var i = 0; i < n; i++) {
			arr[i] = iteratee.apply(context, [i]);
		}

		return arr[i];
	}

	function constant(value) {
		return function () {
			return value;
		};
	}
	
	// return true if value is contained in the list
	function include(list, value, fromIndex) {

		if (list.constructor != Array) return false;

		var thisList = list;
		if (fromIndex) {
			thisList = list.splice(fromIndex);
		}
		if (thisList.indexOf(value) >= 0) {
			return true;
		}

		return false;
	}

	function chainResult(instance, result) {
		return instance._chain ? _.chain(result) : result;
	}

	function mixin(object) {
		_.each(_.functions(object), function (name) {
			_[name] = object[name];
			_.prototype[name] = function () {
				var inputs = [this.wrapped];
				Array.prototype.push.apply(inputs, arguments);
				return chainResult(this, _[name].apply(_, inputs));
			};
		});
	}

	_.mixin(_);
})();