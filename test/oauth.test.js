'use strict';

const expect = require('expect.js');
const muk = require('muk');
const kitx = require('kitx');
const httpx = require('httpx');
const OAuth = require('../');
const config = require('./config');

describe('oauth.js', function () {
  describe('getAuthorizeURL', function () {
    var auth = new OAuth('appid', 'appsecret');
    it('should ok', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_base&state=#wechat_redirect');
    });

    it('should ok with state', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_base&state=hehe#wechat_redirect');
    });

    it('should ok with state and scope', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe', 'snsapi_userinfo');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_userinfo&state=hehe#wechat_redirect');
    });
  });

  describe('getAuthorizeURLForWebsite', function () {
    var auth = new OAuth('appid', 'appsecret');
    it('should ok', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_login&state=#wechat_redirect');
    });

    it('should ok with state', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_login&state=hehe#wechat_redirect');
    });

    it('should ok with state and scope', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe', 'snsapi_userinfo');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_userinfo&state=hehe#wechat_redirect');
    });
  });

  describe('getAccessToken', function () {
    var api = new OAuth(config.appid, config.appsecret);
    it('should invalid', async function () {
      try {
        await api.getAccessToken('code');
      } catch (err) {
        expect(err).to.be.ok();
        expect(err.name).to.be.equal('WeChatAPIError');
        expect(err.message).to.contain('invalid code');
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });

    describe('should ok', function () {
      before(function () {
        muk(httpx, 'request', async function (url, opts) {
          return {
            headers: {}
          };
        });

        muk(httpx, 'read', async function (response, encoding) {
          return JSON.stringify({
            'access_token':'ACCESS_TOKEN',
            'expires_in':7200,
            'refresh_token':'REFRESH_TOKEN',
            'openid':'OPENID',
            'scope':'SCOPE'
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', async function () {
        var token = await api.getAccessToken('code');
        expect(token).to.have.property('data');
        expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at');
      });
    });

    describe('should not ok', function () {
      before(function () {
        muk(httpx, 'request', async function (url, opts) {
          return {
            headers: {}
          };
        });

        muk(httpx, 'read', async function (response, encoding) {
          return JSON.stringify({
            'access_token':'ACCESS_TOKEN',
            'expires_in': 0.1,
            'refresh_token':'REFRESH_TOKEN',
            'openid':'OPENID',
            'scope':'SCOPE'
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should not ok', async function () {
        var token = await api.getAccessToken('code');
        await kitx.sleep(200);
        expect(token.isValid()).not.to.be.ok();
      });
    });
  });

  describe('refreshAccessToken', function () {
    var api = new OAuth('appid', 'secret');

    it('should invalid', async function () {
      try {
        await api.refreshAccessToken('refresh_token');
      } catch (err) {
        expect(err).to.be.ok();
        expect(err.name).to.be.equal('WeChatAPIError');
        expect(err.message).to.contain('invalid appid');
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });

    describe('should ok', function () {
      before(function () {
        muk(httpx, 'request', async function (url, opts) {
          return {
            headers: {}
          };
        });

        muk(httpx, 'read', async function (response, encoding) {
          return JSON.stringify({
            'access_token':'ACCESS_TOKEN',
            'expires_in':7200,
            'refresh_token':'REFRESH_TOKEN',
            'openid':'OPENID',
            'scope':'SCOPE'
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', async function () {
        var token = await api.refreshAccessToken('refresh_token');
        expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at');
      });
    });
  });

  describe('_getUser', function () {
    it('should invalid', async function () {
      try {
        var api = new OAuth('appid', 'secret');
        await api._getUser('openid', 'access_token');
      } catch (err) {
        expect(err).to.be.ok();
        expect(err.name).to.be.equal('WeChatAPIError');
        expect(err.message).to.contain('invalid credential, access_token is invalid or not latest');
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });

    describe('mock get user ok', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(httpx, 'request', async function (url, opts) {
          return {
            headers: {}
          };
        });

        muk(httpx, 'read', async function (response, encoding) {
          return JSON.stringify({
            'openid': 'OPENID',
            'nickname': 'NICKNAME',
            'sex': '1',
            'province': 'PROVINCE',
            'city': 'CITY',
            'country': 'COUNTRY',
            'headimgurl': 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
            'privilege': [
              'PRIVILEGE1',
              'PRIVILEGE2'
            ]
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', async function () {
        var data = await api._getUser('openid', 'access_token');
        expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
          'country', 'headimgurl', 'privilege');
      });
    });
  });

  describe('getUser', function () {
    it('can not get token', async function () {
      var api = new OAuth('appid', 'secret');
      try {
        await api.getUser('openid');
      } catch (err) {
        expect(err).to.be.ok();
        expect(err.message).to.be.equal('No token for openid, please authorize first.');
        return;
      }
      // should never be executed
      expect(false).to.be.ok();
    });

    describe('mock get token error', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', async function (openid) {
          throw new Error('get token error');
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', async function () {
        try {
          await api.getUser('openid');
        } catch (err) {
          expect(err).to.be.ok();
          expect(err.message).to.be.equal('get token error');
          return;
        }
        // should never be executed
        expect(false).to.be.ok();
      });
    });

    describe('mock get null data', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', async function (openid) {
          return null;
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', async function () {
        try {
          await api.getUser('openid');
        } catch (err) {
          expect(err).to.be.ok();
          expect(err).to.have.property('name', 'NoOAuthTokenError');
          expect(err).to.have.property('message', 'No token for openid, please authorize first.');
          return;
        }
        // should never be executed
        expect(false).to.be.ok();
      });
    });

    describe('mock get valid token', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', async function (openid) {
          return {
            access_token: 'access_token',
            create_at: new Date().getTime(),
            expires_in: 60
          };
        });

        muk(api, '_getUser', async function (openid, accessToken) {
          return {
            'openid': 'OPENID',
            'nickname': 'NICKNAME',
            'sex': '1',
            'province': 'PROVINCE',
            'city': 'CITY',
            'country': 'COUNTRY',
            'headimgurl': 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
            'privilege': [
              'PRIVILEGE1',
              'PRIVILEGE2'
            ]
          };
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok with openid', async function () {
        var data = await api.getUser('openid');
        expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
            'country', 'headimgurl', 'privilege');
      });

      it('should ok with options', async function () {
        var data = await api.getUser({openid: 'openid', lang: 'en'});
        expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
          'country', 'headimgurl', 'privilege');
      });

      it('should ok with options', async function () {
        var data = await api.getUser({openid: 'openid'});
        expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
          'country', 'headimgurl', 'privilege');
      });
    });

    describe('mock get invalid token', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', async function (openid) {
          return {
            access_token: 'access_token',
            create_at: new Date().getTime() - 70 * 1000,
            expires_in: 60
          };
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', async function () {
        try {
          await api.getUser('openid');
        } catch (err) {
          expect(err).to.be.ok();
          expect(err).to.have.property('name', 'WeChatAPIError');
          expect(err.message).to.contain('refresh_token missing');
          return;
        }
        // should never be executed
        expect(false).to.be.ok();
      });
    });

    describe('mock get invalid token and refresh_token', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', async function (openid) {
          return {
            access_token: 'access_token',
            refresh_token: 'refresh_token',
            create_at: new Date().getTime() - 70 * 1000,
            expires_in: 60
          };
        });

        muk(api, 'refreshAccessToken', async function (refreshToken) {
          return {
            data: {
              'access_token': 'ACCESS_TOKEN',
              'expires_in': 7200,
              'refresh_token': 'REFRESH_TOKEN',
              'openid': 'OPENID',
              'scope': 'SCOPE'
            }
          };
        });

        muk(api, '_getUser', async function (openid, accessToken) {
          return {
            'openid': 'OPENID',
            'nickname': 'NICKNAME',
            'sex': '1',
            'province': 'PROVINCE',
            'city': 'CITY',
            'country': 'COUNTRY',
            'headimgurl': 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
            'privilege': [
              'PRIVILEGE1',
              'PRIVILEGE2'
            ]
          };
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', async function () {
        var data = await api.getUser('openid');
        expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city', 'country', 'headimgurl', 'privilege');
      });
    });
  });

  describe('mock getUserByCode', function () {
    var api = new OAuth('appid', 'secret');
    before(function () {
      muk(httpx, 'request', async function (url, opts) {
        return {
          headers: {}
        };
      });

      muk(httpx, 'read', async function (response, encoding) {
        return JSON.stringify({
          'access_token':'ACCESS_TOKEN',
          'expires_in':7200,
          'refresh_token':'REFRESH_TOKEN',
          'openid':'OPENID',
          'scope':'SCOPE'
        });
      });

      muk(api, '_getUser', function (openid, accessToken) {
        return {
          'openid': 'OPENID',
          'nickname': 'NICKNAME',
          'sex': '1',
          'province': 'PROVINCE',
          'city': 'CITY',
          'country': 'COUNTRY',
          'headimgurl': 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
          'privilege': [
            'PRIVILEGE1',
            'PRIVILEGE2'
          ]
        };
      });
    });

    after(function () {
      muk.restore();
    });

    it('should ok with getUserByCode', async function () {
      var data = await api.getUserByCode('code');
      expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
        'country', 'headimgurl', 'privilege');
    });

    it('should ok with getUserByCode', async function () {
      var options = {code: 'code', lang: 'en'};
      var data = await api.getUserByCode(options);
      expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
        'country', 'headimgurl', 'privilege');
    });
  });

  describe('verifyToken', function () {
    var api = new OAuth('appid', 'secret');
    it('should ok with verifyToken', async function () {
      try {
          api.verifyToken('openid', 'access_token');
      } catch (err) {
        var result =
        expect(err).to.be.ok();
        expect(err.message).to.contain('access_token is invalid');
      }
    });
  });
});
