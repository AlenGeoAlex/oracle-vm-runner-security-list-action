import * as core from '@actions/core'
import {
  getIpAddress,
  getSecurityList,
  installOciCli,
  isInstalled,
  updateSecurityList
} from './helper.js'
import * as io from '@actions/io'
import { GetSecurityListResponse, IngressRule } from './models.js'
import { wait } from './wait.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const currentRunId = process.env['GITHUB_ACTION']!
    const id = crypto.randomUUID()
    core.saveState(`_ORACLE_VM_RUNNER_ID_${currentRunId}`, id)

    if (!isInstalled()) await installOciCli()
    const cliBin = await io.which('oci', true)
    const silent = core.getBooleanInput('silent', { required: false })
    const securityListId = core
      .getInput('security-list-id', { required: false })
      .trim()

    if (silent) core.setSecret(securityListId)
    core.startGroup('Getting address for the runner')
    let ipAddress = await getIpAddress()

    if (!ipAddress || ipAddress.trim().length === 0) {
      core.error(`Failed to get the runner's ip address`)
      core.endGroup()
      return
    }
    ipAddress = ipAddress.trim()
    if (silent) core.setSecret(ipAddress)
    else core.info('The address has been set to ' + ipAddress)
    let ipAddressWithBlock = `${ipAddress}/32`
    core.endGroup()

    if (silent) core.setSecret(ipAddress)

    const holdIntervalSeconds = parseInt(
      core.getInput('hold-interval', { required: false }) || '5'
    )
    const holdCount = parseInt(
      core.getInput('hold-count', { required: false }) || '12'
    )
    const targetPort = parseInt(
      core.getInput('target-port', { required: false }) || '22'
    )

    if (!validateHoldIntervalAndHoldCount(holdIntervalSeconds, holdCount))
      return

    if (!validateTargetPort(targetPort)) return

    // @ts-ignore
    let securityListResponse: GetSecurityListResponse
    let clonedIngressRules: IngressRule[] = []
    let currentCount = 0
    do {
      securityListResponse = await getSecurityList({
        cliPath: cliBin,
        silent,
        securityGroupOcid: securityListId
      })

      clonedIngressRules = JSON.parse(
        JSON.stringify(securityListResponse.data['ingress-security-rules'])
      ) as IngressRule[]
      if (
        !clonedIngressRules.find((x) =>
          isMatchingSource(ipAddressWithBlock, targetPort, x)
        )
      ) {
        core.info(
          currentCount === 0
            ? `No active address has been found in the existing group, Continuing...`
            : `Got a free slot to add the address...Continuing`
        )
        break
      }

      core.info(
        `Waiting for ${holdIntervalSeconds}. [${currentCount}/${holdCount}]`
      )
      await wait(holdIntervalSeconds * 1000)
      currentCount++
    } while (currentCount < holdCount)

    const ingressRule = {
      source: ipAddressWithBlock,
      protocol: '6',
      'source-type': 'CIDR_BLOCK',
      'is-stateless': false,
      'icmp-options': null,
      description: `${id}-${currentRunId} - Temp Access - Remove if found lingering`,
      'udp-options': null,
      'tcp-options': {
        'destination-port-range': {
          max: targetPort,
          min: targetPort
        },
        'source-port-range': null
      }
    } as IngressRule
    clonedIngressRules.push(ingressRule)
    await updateSecurityList({
      cliPath: cliBin,
      silent,
      securityGroupOcid: securityListId,
      ingressUpdate: clonedIngressRules
    })
    core.info('Ip address has been whitelisted')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }

  function validateTargetPort(port: number): boolean {
    if (!Number.isFinite(port)) {
      core.error(
        'The provided number for port is not a valid positive integer number.'
      )
      return false
    }

    if (port < 0) {
      core.error(
        'The provided number for portis not a valid positive integer number.'
      )
      return false
    }

    return true
  }

  function validateHoldIntervalAndHoldCount(
    interval: number,
    count: number
  ): boolean {
    if (!Number.isFinite(interval)) {
      core.error(
        'The provided number for hold-interval is not a valid positive integer number.'
      )
      return false
    }

    if (interval < 0) {
      core.error(
        'The provided number for hold-interval is not a valid positive integer number.'
      )
      return false
    }

    if (!Number.isFinite(count)) {
      core.error(
        'The provided number for hold-count is not a valid positive integer number.'
      )
      return false
    }

    if (count <= 0) {
      core.error(
        'The provided number for hold-interval is not a valid positive integer number.'
      )
      return false
    }

    return true
  }

  function isMatchingSource(
    address: string,
    port: number,
    rule: IngressRule
  ): boolean {
    if (rule.source === '0.0.0.0/0' || rule.source === address) {
      if (
        !rule['tcp-options'] ||
        !rule['tcp-options']?.['destination-port-range']
      )
        return true

      const ruleElementElement = rule['tcp-options']['destination-port-range']
      if (ruleElementElement.min <= port && ruleElementElement.max >= port)
        return true
    }

    return false
  }
}
