/**
 * 微信网页授权
 * @link https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
 */

type opt = Record<string, string> & { headers?: Record<string, string> }

type ResAccessToken = {
  /** ACCESS_TOKEN */
  access_token: string
  /** 过期时间 */
  expires_in: 7200
  /** 刷新token，用于调用接口，延长access_token的有效期 */
  refresh_token: string
  create_at: number
  /** 用户唯一标识 */
  openid: string
  /** 用户授权的作用域，使用逗号（,）分隔 */
  scope: string
}

/** 微信用户信息 */
type WechatUserInfo = {
  /** 用户的唯一标识 */
  openid: string
  /** 用户昵称 */
  nickname: string
  /** 用户的性别，值为1时是男性，值为2时是女性，值为0时是未知 */
  sex: 0 | 1 | 2
  /** 用户个人资料填写的省份 */
  province: string
  /** 普通用户个人资料填写的城市 */
  city: string
  /** 国家，如中国为CN */
  country: string
  /** 用户头像，最后一个数值代表正方形头像大小（有0、46、64、96、132数值可选，0代表640*640正方形头像），用户没有头像时该项为空。若用户更换头像，原有头像URL将失效。
   * @example 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46'
   * */
  headimgurl: string
  /** 用户特权信息，json 数组，如微信沃卡用户为（chinaunicom） */
  privilege: string[]
  /** 只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段。 */
  unionid?: string
}

type ReqOptions = {
  lang: string
  openid: string
}

/**
 * 正确的JSON返回结果：
 * @example { "errcode":0,"errmsg":"ok"}
 */
type WechatResponseSuccess = {
  errmsg: 'ok'
  errcode: 0
}

// { "errcode":40003,"errmsg":"invalid openid"}
// {"errcode":40029,"errmsg":"invalid code"}
type ErrorMsg = 'invalid openid' | 'invalid code'
/**
 * 返回码	说明
 * - 10003	redirect_uri域名与后台配置不一致
 * - 10004	此公众号被封禁
 * - 10005	此公众号并没有这些scope的权限
 * - 10006	必须关注此测试号
 * - 10009	操作太频繁了，请稍后重试
 * - 10010	scope不能为空
 * - 10011	redirect_uri不能为空
 * - 10012	appid不能为空
 * - 10013	state不能为空
 * - 10015	公众号未授权第三方平台，请检查授权状态
 * - 10016	不支持微信开放平台的Appid，请使用公众号Appid
 * - 40003	invalid openid
 * - 40029	invalid code
 */
type ErrorCode =
  | 40003
  | 40029
  | 10003
  | 10004
  | 10005
  | 10006
  | 10009
  | 10010
  | 10011
  | 10012
  | 10013
  | 10015
  | 10016
/**
 * 错误时的JSON返回示例：
 * @example { "errcode":40003,"errmsg":"invalid openid"}
 */
type WechatResponoseError = {
  errmsg: ErrorMsg
  errcode: ErrorCode
}

type WechatCommonResponse = WechatResponseSuccess | WechatResponoseError

declare class AccessToken {
  data: ResAccessToken
  constructor(data: ResAccessToken)

  /*!
   * 检查AccessToken是否有效，检查规则为当前时间和过期时间进行对比
   *
   * Examples:
   * ```
   * token.isValid();
   * ```
   */
  isValid(): boolean
}

/**
 * 根据appid和appsecret创建OAuth接口的构造函数
 * 如需跨进程跨机器进行操作，access token需要进行全局维护
 * 使用使用token的优先级是：
 *
 * 1. 使用当前缓存的token对象
 * 2. 调用开发传入的获取token的异步方法，获得token之后使用（并缓存它）。
 * Examples:
 * ```
 * var OAuth = require('wechat-oauth');
 * var api = new OAuth('appid', 'secret');
 * ```
 * @param {String} appid 在公众平台上申请得到的appid
 * @param {String} appsecret 在公众平台上申请得到的app secret
 * @param {Generator} getToken 用于获取token的方法
 * @param {Generator} saveToken 用于保存token的方法
 */
declare class OAuth {
  appid: string
  appsecret: string
  store: Record<string, string>
  defaults: opt

  constructor(
    appid: string,
    appsecret: string,
    getToken?: (openid: string) => void,
    saveToken?: (openid: string, token: string) => void
  )

  /**
   * 用于设置urllib的默认options
   *
   * Examples:
   * ```
   * oauth.setOpts({timeout: 15000});
   * ```
   * @param {Object} opts 默认选项
   */
  setOpts(opt: opt)

  /**
   * 获取授权页面的URL地址
   * @param {String} redirect 授权后要跳转的地址
   * @param {String} state 默认: '', 开发者可提供的数据
   * @param {String} [scope] 默认: 'snsapi_base', 作用范围，值为snsapi_userinfo和snsapi_base，前者用于弹出，后者用于跳转
   */
  getAuthorizeURL(redirect: string, state?: string, scope?: string): string

  /**
   * 获取授权页面的URL地址
   * @param {String} redirect 授权后要跳转的地址
   * @param {String} [state] 开发者可提供的数据
   * @param {String} [scope] 默认: 'snsapi_login', 作用范围，值为snsapi_login，前者用于弹出，后者用于跳转
   */
  getAuthorizeURLForWebsite(
    redirect: string,
    state?: string,
    scope?: 'snsapi_login' | string
  ): string

  /*!
   * 处理token，更新过期时间
   */
  processToken(data: ResAccessToken): Promise<AccessToken>

  /**
   * 根据授权获取到的code，换取access token和openid
   * 获取openid之后，可以调用`wechat.API`来获取更多信息
   * Examples:
   * ```
   * await api.getAccessToken(code);
   * ```
   * Exception:
   *
   * - `err`, 获取access token出现异常时的异常对象
   *
   * 返回值:
   * ```
   * {
   *  data: {
   *    "access_token": "ACCESS_TOKEN",
   *    "expires_in": 7200,
   *    "refresh_token": "REFRESH_TOKEN",
   *    "openid": "OPENID",
   *    "scope": "SCOPE"
   *  }
   * }
   * ```
   * @param {String} code 授权获取到的code
   */
  getAccessToken(code: string): Promise<ResAccessToken>

  /**
   * 根据refresh token，刷新access token，调用getAccessToken后才有效
   * Examples:
   * ```
   * api.refreshAccessToken(refreshToken);
   * ```
   * Exception:
   *
   * - `err`, 刷新access token出现异常时的异常对象
   *
   * Return:
   * ```
   * {
   *  data: {
   *    "access_token": "ACCESS_TOKEN",
   *    "expires_in": 7200,
   *    "refresh_token": "REFRESH_TOKEN",
   *    "openid": "OPENID",
   *    "scope": "SCOPE"
   *  }
   * }
   * ```
   * @param {String} refreshToken refreshToken
   */
  refreshAccessToken(refreshToken: string): Promise<ResAccessToken>

  private _getUser(
    options: ReqOptions,
    accessToken: string
  ): Promise<WechatUserInfo>

  /**
   * 根据openid，获取用户信息。
   * 当access token无效时，自动通过refresh token获取新的access token。然后再获取用户信息
   * Examples:
   * ```
   * api.getUser(options);
   * ```
   *
   * Options:
   * ```
   * openId
   * // 或
   * {
   *  "openId": "the open Id", // 必须
   *  "lang": "the lang code" // zh_CN 简体，zh_TW 繁体，en 英语
   * }
   * ```
   * Callback:
   *
   * - `err`, 获取用户信息出现异常时的异常对象
   *
   * Result:
   * ```
   * {
   *  "openid": "OPENID",
   *  "nickname": "NICKNAME",
   *  "sex": "1",
   *  "province": "PROVINCE"
   *  "city": "CITY",
   *  "country": "COUNTRY",
   *  "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
   *  "privilege": [
   *    "PRIVILEGE1"
   *    "PRIVILEGE2"
   *  ]
   * }
   * ```
   * @param {Object|String} options 传入openid或者参见Options
   */
  getUser(options: ReqOptions | string): Promise<WechatUserInfo>

  /**
   * 检验授权凭证（access_token）是否有效
   * @author Jonham.Chen <me@jonham.cn>
   * @date 2021-12-27
   * @link https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html
   * @param {string} openid openid	用户的唯一标识
   * @param {string} accessToken 网页授权接口调用凭证,注意：此access_token与基础支持的access_token不同
   * @returns {Promise<>}
   * @memberof OAuth
   */
  verifyToken(
    openid: string,
    accessToken: string
  ): Promise<WechatCommonResponse>

  /**
   * 根据code，获取用户信息。
   * Examples:
   * ```
   * var user = await api.getUserByCode(code);
   * ```
   * Exception:
   *
   * - `err`, 获取用户信息出现异常时的异常对象
   *
   * Result:
   * ```
   * {
   *  "openid": "OPENID",
   *  "nickname": "NICKNAME",
   *  "sex": "1",
   *  "province": "PROVINCE"
   *  "city": "CITY",
   *  "country": "COUNTRY",
   *  "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
   *  "privilege": [
   *    "PRIVILEGE1"
   *    "PRIVILEGE2"
   *  ]
   * }
   * ```
   * @param {String} code 授权获取到的code
   */
  getUserByCode(code: string): Promise<WechatUserInfo>
}

export = OAuth
export default OAuth
