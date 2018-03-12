/**
 * Created by zhengguorong on 2016/11/30.
 */
var ip = require('ip')
var fs = require('fs')
var shell = require('shelljs')
var mkdirp = require('mkdirp')
var path = require('path')
var ejs = require('ejs')
var rp = require('request-promise')
var crypto = require('crypto')

const buildPassword = 'webhooks'
const base64ToCdn = (imgData) => {
    var fileName = 'image.png'
    var mimeString = imgData.split(',')[0].split(':')[1].split(';')[0]
    if (mimeString.indexOf('/') > -1) {
        var fileNameArray = mimeString.split('/')
        fileName = 'image.' + fileNameArray[fileNameArray.length - 1]
    }
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "")
    var dataBuffer = new Buffer(base64Data, 'base64')
    return rp({
      method: 'POST',
      uri: 'http://58.215.180.210:8099/file/singleFileUploadByFlash',
      formData: {
        file: {
          value: dataBuffer,
          options: {
            filename: fileName,
            contentType: mimeString
          }
        }
      }
    })
}
const gulpFileSvn = (id, email, project) => {
    return rp({
      method: 'POST',
      uri: `http://${ip.address()}:9696/api/build/item`,
      form: {
        email,
        key: project === 'bilin' ? 'h5docMakerPage' : 'h5docMakerPageForFriend',
        branch: 'master',
        changedDirs: JSON.stringify([id]),
        password: crypto.createHash('md5').update(buildPassword).digest('hex')
      }
    })
}
const renderFile = (filePath, data, successCallback) => {
    var rootPath = path.join(__dirname, '../views/')
    fs.readFile(rootPath + filePath, { flag: 'r+', encoding: 'utf8' }, function (err, result) {
        if (err) {
            console.log(err)
            return;
        }
        let html = ejs.render(result, data)
        successCallback(html)
    });
}
const saveFile = (filePath, data, successCallback) => {
    var rootPath = path.join(__dirname, '../public/pages/')
    mkdirp(rootPath, (err) => {
        fs.writeFile(rootPath + filePath, data, function (err) {
            if (err) {
                console.error(err);
            } else {
                successCallback && successCallback()
            }
        });
    })
}
const delFile = (id) => {
    var filePath = path.join(__dirname, '../public/pages/', `${id}.html`)
    return new Promise(function(resolve, reject) {
        let { code, stdout, stderr } = shell.rm(filePath)
        if (code === 0) {
            resolve(stdout)
        } else {
            reject(stderr)
        }
    })
}
const delGulpFolder = (id) => {
    var releasePath = path.join(__dirname, '../public/release/', `${id.slice(0, 12)}/`)
    return new Promise(function(resolve, reject) {
        let { code, stdout, stderr } = shell.rm('-rf', releasePath)
        if (code === 0) {
            resolve(stdout)
        } else {
            reject(stderr)
        }
    })
}

module.exports = {
    base64ToCdn,
    gulpFileSvn,
    renderFile,
    saveFile,
    delFile,
    delGulpFolder
}
