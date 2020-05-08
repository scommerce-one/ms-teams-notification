import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'
import axios from 'axios'
import moment from 'moment-timezone'
import {createMessageCard} from './message-card'

const escapeMarkdownTokens = (text: string) =>
  text
    .replace(/\n\ {1,}/g, '\n ')
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\|/g, '\\|')
    .replace(/#/g, '\\#')
    .replace(/-/g, '\\-')
    .replace(/>/g, '\\>')

const formatFilesToDisplay = (
  files: any,
  allowedLength: number,
  htmlUrl: string
) => {
  const filesChanged = files
    .slice(0, allowedLength)
    .map(
      (file: any) =>
        `[${escapeMarkdownTokens(file.filename)}](${file.blob_url}) (${
          file.changes
        } changes)`
    )

  let filesToDisplay = ''
  if (files.length === 0) {
    filesToDisplay = '*No files changed.*'
  } else {
    filesToDisplay = '* ' + filesChanged.join('\n\n* ')
    if (files.length > 7) {
      const moreLen = files.length - 7
      filesToDisplay += `\n\n* and [${moreLen} more files](${htmlUrl}) changed`
    }
  }

  return filesToDisplay
}

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token', {required: true})
    const msTeamsWebhookUri: string = core.getInput('ms-teams-webhook-uri', {
      required: true
    })

    console.log('made it here')
    const notificationSummary =
      core.getInput('notification-summary') || 'GitHub Action'
    const timezone = core.getInput('timezone') || 'UTC'
    const allowedFileLen = core.getInput('allowed-file-len').toLowerCase()
    const allowedFileLenParsed = parseInt(
      allowedFileLen === '' ? '7' : allowedFileLen
    )

    const timestamp = moment()
      .tz(timezone)
      .format('dddd, MMMM Do YYYY, h:mm:ss a z')

    console.log('made it here 2')
    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/')
    const sha = process.env.GITHUB_SHA || ''
    const ref = process.env.GITHUB_REF || ''
    const runId = process.env.GITHUB_RUN_ID || ''
    const runNum = process.env.GITHUB_RUN_NUMBER || ''
    const eventName = process.env.GITHUB_EVENT_NAME || ''
    const params = {owner, repo, ref: sha}
    const repoName = params.owner + '/' + params.repo
    const repoUrl = `https://github.com/${repoName}`
    const branchUrl = `${repoUrl}/tree/${ref}`

    const octokit = new Octokit({auth: `token ${githubToken}`})
    const commit = await octokit.repos.getCommit(params)
    const author = commit.data.author

    const filesToDisplay = formatFilesToDisplay(
      commit.data.files,
      allowedFileLenParsed,
      commit.data.html_url
    )

    console.log('made it here 3')

    const messageCard = await createMessageCard(
      notificationSummary,
      commit,
      repo,
      author,
      runNum,
      runId,
      eventName,
      branchUrl,
      repoName,
      sha,
      repoUrl,
      timestamp
    )

    console.log(messageCard)

    axios
      .post(msTeamsWebhookUri, messageCard)
      .then(function(response) {
        console.log(response)
        core.debug(response.data)
      })
      .catch(function(error) {
        core.debug(error)
      })
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }
}

run()
