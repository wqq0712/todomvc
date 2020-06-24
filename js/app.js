(function (window) {

	//进行本地存储、获取数据
	const STORAGE_KEY = "todoitems"
	const itemsStorage = {
		//获取数据
		fetch: function() {
			//从localStorage中获取Json字符串，如果为空，则返回空数组字符串: []
			//然后将字符串转为数组对象
			return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
		},
		//保存数据
		save: function(items) {
			//对象转化为Json字符串保存到LocalStorage
			localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
		}
	}

	//自定义全局指令获取焦点，其实也可以定义为局部指令，我这里是为了练习，所以定义个全局的
	Vue.directive('focus', {
		//inserted只有在被绑定到dom父节点的时候才会执行，且只执行1次
		inserted(el, binding) {
			el.focus();
		}
	})
	

	var todoapp = new Vue({
		el: "#app",
		data: {
			title: '我的任务',
			items: itemsStorage.fetch(),
			currentItem: null,
			//过滤状态
			filterStatus: 'all'
		},
		
		//这里使用自定义局部指令
		directives: {
			//双击任务项，进入编辑状态，自动获取焦点
			//update会在指令所在的元素内容发生变化的时候执行
			//所以每次双击进入任务编辑状态，指令的值发生变化，会触发update
			'todo-focus': {
				update (el, binding) {
					//通过binding获取指令的值
					//指令的值: item === currentItem 表示当前元素是否就是指令所在元素
					//只有当前点击的元素才获取焦点
					if(binding.value) {
						el.focus()
					}
				}
			}
		},
		
		computed: {
			//计算剩余未完成任务
			unCompletedCount() {
				/*
				var count = 0;
				for (i = 0; i < this.items.length; i++) { 
					if(!this.items[i].completed) {
						count++;
					}
				}
				return count;
				*/
				//获取未完成的任务项
				const unCompletedItems = this.items.filter(function (item){
					return !item.completed
				})
				return unCompletedItems.length
			},

			//这里的计算属性将同时定义getter和setter方法，上面的leftCount计算属性默认只是getter方法
			toggleAll: {
				//当任务列表中复选框状态发生变化，那么更新全选框状态
				//get方法会根据函数体内的相关属性变化，来调用get方法
				//这里是当unCompletedCount发生变化，那么触发get方法
				get() {
					//未完成数为0， 就是全选框状态为勾选，否则为未勾选
					//console.log(this.unCompletedCount)
					return this.unCompletedCount === 0
				},
				//当点击全选框后，全选框状态发生变化，将触发set方法
				set: function(newStatus) {	//参数传入新的toggleAll的值
					//迭代出所有任务列表，将全选框的值赋值给每个任务的复选框
					/*
					this.items.forEach(function (element){
						element.completed = newStatus
					})
					*/
					//使用ES6匿名函数
					this.items.forEach(element => {
						element.completed = newStatus
					});
					
				}
			},

			//根据不同路由状态过滤出不同数据
			filterItems() {
				switch (this.filterStatus) {
					case 'active':
						return this.items.filter(item => !item.completed)
					case 'completed':
						return this.items.filter(item => item.completed)
					default:
						return this.items;
				}
			}
		},
		methods: {
			
			addNewItem(event) {
				const content = event.target.value.trim();
				//content.length = 0 表示false
				if(!content.length) {
					//如果输入框内容为空或者空字符串，则直接返回
					return;
				}
				const id = this.items.length + 1

				this.items.push({
					id,
					content,
					completed: false
				});
				//将输入框置空
				event.target.value = ''
			},

			//移除
			removeItem(index) {
				//移除指定索引开始的，1个元素
				this.items.splice(index, 1)
			},

			//清除已完成
			removeCompleted() {
				//清除已完成的很简单，过滤出所有未完成的，重新赋值给this.items
				/*
				const unCompletedItems = this.items.filter(item => {
					return !item.completed
				})
				*/
				//因为匿名函数体内只有1行代码，可以继续使用以下方式简写
				const unCompletedItems = this.items.filter(item => !item.completed)
				this.items = unCompletedItems
			},

			//进入编辑状态
			toEdit(item) {
				//将点击的item 赋值给currentItem，用于item显示为可编辑修改状态
				this.currentItem = item
			},

			//取消编辑状态
			cancelEdit() {
				//取消编辑状态仅仅需要将currentItem设置为null, 
				//因为editing样式是通过比较item===currentItem来判断的
				this.currentItem = null
			},

			//完成编辑，保存数据
			finishEdit(item, index, event) {
				//1.获取当前输入框的值
				const content = event.target.value.trim()
				if(!content.length) {
					//如果输入框内容为空或者空字符串，则删除任务项, 直接复用removeItem方法
					//注意一定要用this, 否则会报错
					this.removeItem(index)
					return;
				}
				//3.如果不为空，则更新任务项值为新值
				item.content = content
				//4.退出编辑状态
				this.currentItem = null
			}

		},
		//定义监听器
		watch: {
			//监听items, 当数据发生变化的时候持久化到LocalStorage
			//这里监听items，这里只能监听删除和新增，不能监听到对象里面的content属性变化
			//所以双击任务编辑content，是不会触发items的监听函数
			//需要监听对象内部的属性变化，需要设置deep属性深度监听
			/*
			items: function (newValue, old) {
				console.log('watch:' + newValue)
			}
			*/
			items: {
				deep: true,	//深度监听
				handler: function(newValue, old) {
					//保存到LocalStorage，localStorage一般浏览器限制5M大小
					itemsStorage.save(newValue)
				}
			}
		}
	})

	//当路由hash值发生变化的时候，会自动调用这个函数
	//这个方法是window的，所以是个vue实例同级的。
	window.onhashchange = function () {
		const hashVal = window.location.hash
		//console.log('hash变化了:' + hashVal)
		//截取hash值部分, #/active  #/completed  #/
		// || 作用是如果substr出来的为空，就取值 all
		const hash = hashVal.substr(2) || 'all'
		// hash值变化后，将hash值赋值给vue实例的filterStatus属性
		todoapp.filterStatus = hash

		
	}

	//  直接浏览器输入/index.html#/completed时，不会默认调用onhashchange
	//  这里手动调用onhashchange方法
	window.onhashchange()

})(window);
