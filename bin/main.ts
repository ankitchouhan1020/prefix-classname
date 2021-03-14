#!/usr/bin/env node

const yargs = require('yargs')
const execa = require('execa')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const CodemodErrorInstance = require('./utils/CodemodError')

const jscodeshiftExecutable = require('jscodeshift')
const transformsDir = path.resolve(__dirname, '../', 'transforms')

const { argv } = yargs

try {
  const selectedCodemod = argv._[0]
  const directoryToApplyTo = argv._[1]

  if (!selectedCodemod || !directoryToApplyTo) {
    throw new CodemodErrorInstance({
      type: 'Invalid params',
    })
  }

  const availableTransforms = fs
    .readdirSync(transformsDir)
    .filter(v => v !== '__tests__' && v !== '__testfixtures__')
    .map(v => v.replace('.ts', ''))


  if (!availableTransforms.some(t => t === selectedCodemod)) {
    throw new CodemodErrorInstance({
      type: 'Unrecognised transform',
      payload: selectedCodemod,
    })
  }


  const result = execa.commandSync(
    `${jscodeshiftExecutable} -t ${transformsDir}/${selectedCodemod}.ts ${directoryToApplyTo}`,
    {
      stdio: 'inherit',
      stripEof: false,
    },
  )

  if (result.error) {
    throw result.error
  }
} catch (err) {
  if (err.type === 'Invalid params') {
    console.error(chalk.red('Invalid params passed!'))
    console.error(
      chalk.red(
        'prefix-codemod requires 2 params to be passed, the name of the codemod, and a directory to apply the codemod to.',
      ),
    )
    console.error(
      chalk.red(
        'Example: npx prefix-codemod prefix-classname ./src/client',
      ),
    )

    process.exit(1)
  }

  if (err.type === 'Unrecognised transform') {
    console.error(chalk.red(`Unrecognised transform passed: '${err.payload}'`))

    process.exit(2)
  }

  // For other errors, just re-throw it
  throw err
}