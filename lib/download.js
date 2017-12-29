const download = require('download-git-repo')
const path = require('path')
const ora = require('ora')

module.exports = function (target) {
    target = path.join(target || '.', '.')
    return new Promise((resolve, reject) => {
        const url = 'https://github.com:zagss/lv-templates#master'
        const spinner = ora(`Downloading template...`)
        spinner.start()
        download(url, target, { clone: true }, (err) => {
            if (err) {
                spinner.fail()
                reject(err)
            } else {
                spinner.succeed()
                resolve(target)
            }
        })
    })
}