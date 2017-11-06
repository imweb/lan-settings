# lan-settings
用于设置操作系统的局域网设置的Node模块（Node >= v0.10），当前只支持Windows平台，后续会支持Mac及Linux的局域网设置：

![LAN Settings](https://raw.githubusercontent.com/imweb/lan-settings/master/assets/settings.png)


#### 安装

	npm i --save lan-settings

#### 使用
	
	var lan = require('lan-settings');
	// 获取当前局域网设置信息，如果err非空，表示获取失败
	lan.getSettings(function(err, settings) {
		console.log(settings);
	    // output:
	    // { autoDetect: false,
	    //   autoConfig: false,
	    //   autoConfigUrl: '',
	    //   proxyEnable: true,
	    //   proxyServer: '127.0.0.1:8888',
	    //   bypassLocal: false,
	    //   bypass: '' }
	});

	// 自动检测设置
	lan.setSettings({ autoDetect: true }, function(err) {
		console.log(err ? 'Fail' : 'Success');
	});

	// 开启并这种PAC脚本
	lan.setSettings({
		autoConfig: true,
		autoConfigUrl: 'http://127.0.0.1:30001/'
	}, function(err) {
		console.log(err ? 'Fail' : 'Success');
	});
	
	// 开启并设置统一的代理服务器，开启本地代理白名单
	lan.setSettings({
		proxyEnable: true,
		proxyServer: '127.0.0.1:8888',
		bypassLocal: true
	}, function(err) {
		console.log(err ? 'Fail' : 'Success');
	});

	// 高级设置，对http、https、ftp、socks分别设置不同的代理，并设置白名单域名前缀
	lan.setSettings({
		proxyEnable: true,
		proxyServer: 'http=127.0.0.1:8888;https=127.0.0.1:8889;ftp=127.0.0.1:8890;socks=127.0.0.1:8891',
		bypassLocal: false,
		bypass: 'www.test;www.abc'
	}, function(err) {
		console.log(err ? 'Fail' : 'Success');
	});

	// 重置到修改前的设置
	lan.reset(function(err) {
		console.log(err ? 'Fail' : 'Success');
	});
	

#### API

**lan.getSettngs(cb)**:  获取当前局域网设置信息，其中 `cb(err, settings)` 为必填回调函数，如果出错 err不为空，否则settings为当前系统局域网设置信息，结构如下：

	{
	  autoDetect: true, // 是否开启自动检查设置
	  autoConfig: true, // 是否开启pac脚本 
	  autoConfigUrl: 'http://127.0.0.1:50011', // pac脚本的url
	  proxyEnable: true, // 是否开启代理设置
	  proxyServer: '127.0.0.1:8888', // 代理服务器ip和端口，如果使用高级设置，可能返回 `htt=127.0.0.1:8888;https=127.0.0.2:8889`等
	  bypassLocal: true, // 是否启用对本地地址不使用代理
	  bypass: 'www.test;www.abc' // 高级设置里面的白名单信息
	}


**lan.setSettngs(settings, cb)**: 设置局域网信息，settings如上，如果为null表示清空并关闭所有局域网设置项，`cb(err)` 为必填回调函数，如果设置失败，则err不为空。

**lan.reset(cb)**: 将局域网设置重置到修改前，`cb(err)` 为必填回调函数，如果重置失败，则err不为空。

# License
[MIT](https://github.com/imweb/lan-settings/blob/master/LICENSE)