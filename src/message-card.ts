export function createMessageCard(
  notificationSummary: string,
  notificationColor: string,
  commit: any,
  author: any,
  runNum: string,
  runId: string,
  repoName: string,
  sha: string,
  repoUrl: string
): any {
  return {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: notificationSummary,
    themeColor: notificationColor,
    title: notificationSummary,
    sections: [],
    potentialAction: [
      {
        '@context': 'https://schema.org',
        target: [`${repoUrl}/actions/runs/${runId}`],
        '@type': 'ViewAction',
        name: 'View Workflow Run'
      }
    ]
  }
}
