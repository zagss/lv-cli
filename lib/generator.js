const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const minimatch = require('minimatch')
const path = require('path')
const fs = require('fs')
const rm = require('rimraf').sync

module.exports = function (metadata = {}, src, dest = '.') {
    if (!src) {
      return Promise.reject(new Error(`无效的source：${src}`))
    }
    return new Promise((resolve, reject) => {
      const metalsmith = Metalsmith(process.cwd())
        .metadata(metadata)
        .clean(false)
        .source(src)
        .destination(dest)
        // 判断下载的项目模板中是否有templates.ignore
        const ignoreFile = path.join(src, 'templates.ignore')
        if (fs.existsSync(ignoreFile)) {
            // 定义一个用于移除模板中被忽略文件的metalsmith插件
            metalsmith.use((files, metalsmith, done) => {
                const meta = metalsmith.metadata()
                // 先对ignore文件进行渲染，然后进行切割ignore文件的内容，拿到被忽略清单
                const ignores = Handlebars.compile(fs.readFileSync(ignoreFile).toString())(meta)
                    .split('\n').filter(item => !!item.length)
                console.log(ignores)
                console.log(files)
                Object.keys(files).forEach(fileName => {
                    // 移除被忽略的文件
                    ignores.forEach(ignorePattern => {
                        // console.log(ignorePattern)
                        if (minimatch(fileName, ignorePattern)) {
                            delete files[fileName]
                        }
                    })
                })
                done()
            })
        }
        metalsmith.use((files, metalsmith, done) => {
            const meta = metalsmith.metadata()
            Object.keys(files).forEach(fileName => {
                const t = files[fileName].contents.toString()
                files[fileName].contents = new Buffer(Handlebars.compile(t)(meta))
            })
            done()
        }).build(err => {
            rm(src)
            err ? reject(err) : resolve(metadata)
        })
    })
  }