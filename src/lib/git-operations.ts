import { clone, push, add, commit, listFiles, checkout, log, branch } from 'isomorphic-git'
import * as http from 'isomorphic-git/http/web'
import LightningFS from '@isomorphic-git/lightning-fs'

// Initialize the file system
const ifs = new LightningFS('myeditor')

interface CommitOptions {
  message: string;
  author: {
    name: string;
    email: string;
  };
}

export class GitOperations {
  constructor(private workDir: string) {}

  // This is NOT possible with Isomorphic Git alone!
  // We need GitHub's API to:
  // 1. List available repositories
  // 2. Get repository metadata
  // 3. Get access permissions
  async listRepositories() {
    throw new Error('Cannot list GitHub repositories with Isomorphic Git - requires GitHub API')
  }

  async clone(url: string, token?: string) {
    // This works with Isomorphic Git, but we won't know:
    // - If we have permission to clone
    // - Repository visibility (private/public)
    // - Repository description
    // - Default branch
    // - Collaborators
    // Without using GitHub's API
    await clone({
      fs: ifs,
      http,
      dir: this.workDir,
      url,
      corsProxy: 'https://cors.isomorphic-git.org',
      onAuth: () => ({
        username: token || '',
        password: token || '',
      }),
    })
  }

  async commit({ message, author }: CommitOptions) {
    // Stage all changes
    await add({
      fs: ifs,
      dir: this.workDir,
      filepath: '.',
    })

    // Create commit
    await commit({
      fs: ifs,
      dir: this.workDir,
      message,
      author,
    })
  }

  async listFiles() {
    return listFiles({
      fs: ifs,
      dir: this.workDir,
    })
  }

  async getHistory() {
    return log({
      fs: ifs,
      dir: this.workDir,
    })
  }

  async checkoutBranch(branchName: string) {
    await checkout({
      fs: ifs,
      dir: this.workDir,
      ref: branchName,
    })
  }

  async createBranch(branchName: string) {
    await branch({
      fs: ifs,
      dir: this.workDir,
      ref: branchName,
      checkout: true,
    })
  }

  async pushChanges(token: string) {
    await push({
      fs: ifs,
      http,
      dir: this.workDir,
      corsProxy: 'https://cors.isomorphic-git.org',
      onAuth: () => ({
        username: token || '',
        password: token || '',
      }),
    })
  }
}