#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const inquirer = require('inquirer')
const latestVersion = require('latest-version')
const chalk = require('chalk')
const logSymbols = require('log-symbols')
const ora = require('ora')
const download = require('../lib/download')
const generator = require('../lib/generator')

program.usage('<project-name>').parse(process.argv)

// console.log(program)
let projectName = program.args[0]

if (!projectName) {
    program.help()
    return
}

const list = glob.sync('*') // 遍历当前目录
let rootName = path.basename(process.cwd())

// console.log(list)
// console.log(rootName)
// console.log(fs.statSync('bin').isDirectory())
let next = undefined
if (list.length) {
    if (list.filter(name => {
        const fileName = path.resolve(process.cwd(), path.join('.', name))
        // console.log(fileName)
        const isDir = fs.statSync(fileName).isDirectory()
        return name.indexOf(projectName) !== -1 && isDir
    }).length !== 0) {
        console.log(`项目${projectName}已经存在`)
        return
    }
    // rootName = projectName
    next = Promise.resolve(projectName)
} else if (rootName === projectName) {
    // console.log(`当前目录名称与新创建工程名称相同`)
    // rootName = "."
    next = inquirer.prompt([
        {
            name: 'buildInCurrent',
            message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
            type: 'comfirm',
            default: true
        }
    ]).then(answer => {
        return Promise.resolve(answer.buildInCurrent ? '.' : projectName)
    })
} else {
    // rootName = projectName
    next = Promise.resolve(projectName)
}

next && go()

function go () {
    // console.log(path.resolve(process.cwd(), path.join('.', rootName)))
    // download(rootName)
    //     .then(target => console.log(target))
    //     .catch(err => console.log(err))

    next.then(projectRoot => {
        if (projectRoot !== '.') {
            fs.mkdirSync(projectRoot)
        }
        return download(projectRoot).then(target => {
            return {
                name: projectRoot,
                root: projectRoot,
                downloadTemp: target
            }
        })
    }).then(context => {
        // console.log(context)
        return inquirer.prompt([
            {
                name: 'projectName',
                message: '项目的名称',
                default: context.name
            }, {
                name: 'projectVersion',
                message: '项目的版本号',
                default: '0.0.1'
            }, {
                name: 'projectDescription',
                message: '项目的简介',
                default: `A project named ${context.name}`
            }
        ]).then(answers => {
            // console.log(answers)
            const spinner = ora('正在获取UI包的最新版本。。。')
            spinner.start()
            return latestVersion('mint-ui').then(version => {
                if (version) {
                    spinner.succeed()
                    console.log(logSymbols.info, chalk.blue(`当前UI包的最新版本为 ${version}`))
                    answers.supportUiVersion = version
                }
                // return {
                //     ...context,
                //     metadata: {
                //         ...answers
                //     }
                // }
                return generator({...answers}, './hello-cli')
            })
        }).catch(err => {
            return Promise.reject(err)
        })
    }).then(context => {
        // console.log(context)
        console.log(logSymbols.success, chalk.green('创建成功 :)'))
        console.log()
        console.log(chalk.green('cd ' + context.projectName + '\nnpm install\nnpm run dev'))
    }).catch(err => {
        console.error(err)
        console.error(logSymbols.error, chalk.red(`创建失败：${err.message}`))
    })
}