# tianma-mount

在给定域名或路径上使用中间件。

## 安装

	$ npm install tianma-mount

## 使用

### 挂载域名

	tianma()
		.mount('localhost').then
			.use(middleware)
			.end
		.mount('www.example.com').then
			.use(middleware)
			.end
		.mount('example.com').then
			.use(middleware)
			.end
			
### 挂载路径

	tianma()
		.mount('/foo').then
			.use(middleware)
			.end
		.mount('/bar/baz').then
			.use(middleware)
			.end
		.mount('/').then
			.use(middleware)
			.end
			
### 挂载域名加路径

	tianma()
		.mount('localhost').then
			.mount('/foo').then
				.use(middleware)
				.end
			.mount('/bar').then
				.use(middleware)
				.end
			.end
		.mount('example.com/foo').then
			.use(middleware)
			.end
		.mount('example.com/bar').then
			.use(middleware)
			.end
			
### 路径切除

请求路径与挂载路径匹配时，`request.pathname`中的挂载部分会被切除，切除掉的部分可通过`request.base`访问。

	tianma()
		.use(function *(next) {
			this.request.url('/foo/bar');
		})
		.mount('/foo').then
			.use(function *(next) {
				this.request.base; // => "/foo"
				this.request.pathname; // => "/bar"
			})
			.end

## 授权协议

[MIT](https://github.com/tianmajs/tianmajs.github.io/blob/master/LICENSE)