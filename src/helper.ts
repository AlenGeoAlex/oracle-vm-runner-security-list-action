import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { GetSecurityListResponse, IngressRule } from './models.js'
import { ExecOutput } from '@actions/exec'
import { HttpClient } from '@actions/http-client'

/**
 * Is OCI CLI installed
 */
export function isInstalled() {
  return fs.existsSync(getOciPath())
}

/**
 * Get the OCI CLI installation path
 */
function getOciPath(): string {
  return path.join(os.homedir(), '.oci-cli-installed')
}

/**
 * Install the OCI CLI
 */
export async function installOciCli(): Promise<void> {
  core.startGroup('Installing Oracle Cloud Infrastructure CLI')
  const cli = await exec.getExecOutput('python -m pip install oci-cli')

  if (cli && cli.exitCode == 0) {
    fs.writeFileSync(path.join(os.homedir(), '.oci-cli-installed'), 'success')
  }
  core.endGroup()
}

export async function getSecurityList(options: {
  cliPath: string
  securityGroupOcid: string
  silent?: boolean
}): Promise<GetSecurityListResponse> {
  let execResult: ExecOutput
  const command = `${options.cliPath} network security-list get --security-list-id ${options.securityGroupOcid}`
  execResult = await exec.getExecOutput(command, [], {
    silent: options.silent ?? false
  })

  if (execResult && execResult.exitCode === 0)
    return JSON.parse(execResult.stdout) as GetSecurityListResponse

  throw new Error(execResult.stderr || execResult.stdout)
}

export async function getIpAddress(): Promise<string | undefined> {
  let ipAddress: string | undefined = undefined
  ipAddress = await getFromCheckIpAws()
  if (ipAddress) return ipAddress

  return undefined
}

async function getFromCheckIpAws(): Promise<string | undefined> {
  try {
    core.info(
      'Trying to fetch the ip address from https://checkip.amazonaws.com'
    )
    const httpResponse = await new HttpClient(
      'GitHub-Actions/oracle-vm-runner-security-list-action'
    ).get('https://checkip.amazonaws.com')
    if (
      httpResponse.message.statusCode &&
      httpResponse.message.statusCode === 200
    )
      return await httpResponse.readBody()

    core.warning(
      `checkip.amazonaws.com failed to return the ip address and instead ${await httpResponse.readBody()}`
    )
    return undefined
  } catch (err) {
    if (err instanceof Error)
      core.warning(
        `checkip.amazonaws.com failed to return the ip address with error ${err.message}`
      )

    return undefined
  }
}

export async function updateSecurityList(options: {
  cliPath: string
  securityGroupOcid: string
  ingressUpdate: IngressRule[]
  silent?: boolean
}): Promise<void> {
  let execResult: ExecOutput
  const command = `${options.cliPath} network security-list update --security-list-id ${options.securityGroupOcid} --force --ingress-security-rules ${JSON.stringify(JSON.stringify(options.ingressUpdate))}`
  execResult = await exec.getExecOutput(command, [], {
    silent: options.silent ?? false
  })

  if (execResult && execResult.exitCode === 0) return

  throw new Error(execResult.stderr || execResult.stdout)
}
