co-wechat-oauth
===============

Wechat OAuth for ES6。微信公共平台OAuth接口消息接口服务中间件与API SDK

## 模块状态

- [![NPM version](https://badge.fury.io/js/co-wechat-oauth.png)](http://badge.fury.io/js/co-wechat-oauth)
- [![Build Status](https://travis-ci.org/node-webot/co-wechat-oauth.png?branch=master)](https://travis-ci.org/node-webot/co-wechat-oauth)
- [![Dependencies Status](https://david-dm.org/node-webot/co-wechat-oauth.png)](https://david-dm.org/node-webot/co-wechat-oauth)
- [![Coverage Status](https://coveralls.io/repos/node-webot/co-wechat-oauth/badge.png)](https://coveralls.io/r/node-webot/co-wechat-oauth)

## 功能列表

- OAuth授权
- 获取基本信息

OAuth2.0网页授权，使用此接口须通过微信认证，如果用户在微信中（Web微信除外）访问公众号的第三方网页，公众号开发者可以通过此接口获取当前用户基本信息（包括昵称、性别、城市、国家）。详见：[官方文档](http://mp.weixin.qq.com/wiki/17/c0f37d5704f0b64713d5d2c37b468d75.html)

详细参见[API文档](http://doxmate.cool/node-webot/co-wechat-oauth/api.html)

## Installation

```sh
$ npm install co-wechat-oauth
```

## Usage

### 初始化

引入OAuth并实例化

```js
var OAuth = require('co-wechat-oauth');
var client = new OAuth('your appid', 'your secret');
```

以上即可满足单进程使用。
当多进程时，token需要全局维护，以下为保存token的接口。

```js
var oauthApi = new OAuth('appid', 'secret', function (openid) {
  // 传入一个根据openid获取对应的全局token的方法
  var txt = fs.readFileSync(openid + ':access_token.txt', 'utf8');
  return JSON.parse(txt);
}, function (openid, token) {
  // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
  // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
  // 持久化时请注意，每个openid都对应一个唯一的token!
  fs.writeFileSync(openid + ':access_token.txt', JSON.stringify(token));
});
```

### 引导用户
生成引导用户点击的URL。

```js
var url = client.getAuthorizeURL('redirectUrl', 'state', 'scope');
```

如果是PC上的网页，请使用以下方式生成
```js
var url = client.getAuthorizeURLForWebsite('redirectUrl');
```

### 获取Openid和AccessToken
用户点击上步生成的URL后会被重定向到上步设置的 `redirectUrl`，并且会带有`code`参数，我们可以使用这个`code`换取`access_token`和用户的`openid`

```js
async function () {
  var token = await client.getAccessToken('code');
  var accessToken = token.data.access_token;
  var openid = token.data.openid;
}
```

### 获取用户信息
如果我们生成引导用户点击的URL中`scope`参数值为`snsapi_userinfo`，接下来我们就可以使用`openid`换取用户详细信息（必须在getAccessToken方法执行完成之后）

```js
async function () {
  var userInfo = yield client.getUser('openid');
}
```

## 捐赠
如果您觉得Wechat OAuth对您有帮助，欢迎请作者一杯咖啡

![捐赠wechat](https://cloud.githubusercontent.com/assets/327019/2941591/2b9e5e58-d9a7-11e3-9e80-c25aba0a48a1.png)

或者[![](http://img.shields.io/gratipay/JacksonTian.svg)](https://www.gittip.com/JacksonTian/)

## 交流群
QQ群：157964097，使用疑问，开发，贡献代码请加群。

## Contributors
感谢以下贡献者：

```
$ git summary

 project  : co-wechat-oauth
 repo age : 1 year, 8 months
 active   : 8 days
 commits  : 16
 files    : 11
 authors  :
    13  Jackson Tian  81.2%
     2  linkkingjay   12.5%
     1  wangxiuwen    6.2%

```

## License
The MIT license.
