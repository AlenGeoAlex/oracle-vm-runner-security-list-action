import * as core from '@actions/core'
import * as io from '@actions/io'
import {
  getSecurityList,
  installOciCli,
  isInstalled,
  updateSecurityList
} from './helper.js'

export async function run() {
  main()
}

async function main(): Promise<void> {
  try {
    const id = await getIdFromState()
    if (!id || id.trim().length === 0) {
      core.warning('No state has been set to cleanup..')
      return
    }

    if (!isInstalled()) await installOciCli()
    const cliBin = await io.which('oci', true)
    const silent = core.getBooleanInput('silent', { required: false })
    const securityListId = core
      .getInput('security-list-id', { required: false })
      .trim()

    if (silent) core.setSecret(securityListId)

    const securityListResponse = await getSecurityList({
      cliPath: cliBin,
      securityGroupOcid: securityListId,
      silent: silent
    })

    const ingressRule = securityListResponse.data[
      'ingress-security-rules'
    ].find((x) => x.description.startsWith(id))
    if (!ingressRule) {
      core.warning('The ingress rule has already been cleaned up...')
      return
    }

    core.info('Found the ingress rule, starting clean up..')
    const ingressRules = securityListResponse.data[
      'ingress-security-rules'
    ].filter((x) => x.description.startsWith(id))
    await updateSecurityList({
      cliPath: cliBin,
      ingressUpdate: ingressRules,
      securityGroupOcid: securityListId,
      silent: silent
    })
    core.info('Security list updated..')
    core.info('Cleanup completed...')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function getIdFromState(): Promise<string> {
  const currentRunId = process.env['GITHUB_ACTION']!
  return core.getState(`_ORACLE_VM_RUNNER_ID_${currentRunId}`)
}
